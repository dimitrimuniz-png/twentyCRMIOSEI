import { Select } from '@/ui/input/components/Select';
import { SettingsOptionCardContentSwitch } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSwitch';
import { getToastOptionsFromError } from '@/error-handler/utils/getToastOptionsFromError';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { Table } from '@/ui/layout/table/components/Table';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';
import { Section } from 'twenty-ui/components/layout';
import { IconCheck, IconUserPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { Card, Tooltip } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const PENDING_WORKSPACE_MEMBER_APPROVAL_SETTINGS = gql`
  query PendingWorkspaceMemberApprovalSettings {
    pendingWorkspaceMembers {
      userWorkspaceId
      email
      firstName
      lastName
      createdAt
    }
    memberApprovalAssignableRoles {
      id
      label
    }
    currentWorkspaceMemberApproval {
      approvalStatus
      isMemberApprovalRequired
    }
  }
`;

const APPROVE_PENDING_WORKSPACE_MEMBER = gql`
  mutation ApprovePendingWorkspaceMember(
    $userWorkspaceId: UUID!
    $roleId: UUID!
  ) {
    approvePendingWorkspaceMember(
      userWorkspaceId: $userWorkspaceId
      roleId: $roleId
    )
  }
`;

const REJECT_PENDING_WORKSPACE_MEMBER = gql`
  mutation RejectPendingWorkspaceMember($userWorkspaceId: UUID!) {
    rejectPendingWorkspaceMember(userWorkspaceId: $userWorkspaceId)
  }
`;

const UPDATE_WORKSPACE_MEMBER_APPROVAL_REQUIRED = gql`
  mutation UpdateWorkspaceMemberApprovalRequired(
    $input: UpdateWorkspaceInput!
  ) {
    updateWorkspace(data: $input) {
      id
    }
  }
`;

type PendingWorkspaceMember = {
  userWorkspaceId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
};

type MemberApprovalAssignableRole = {
  id: string;
  label: string;
};

type PendingWorkspaceMemberApprovalSettingsQuery = {
  pendingWorkspaceMembers: PendingWorkspaceMember[];
  memberApprovalAssignableRoles: MemberApprovalAssignableRole[];
  currentWorkspaceMemberApproval: {
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    isMemberApprovalRequired: boolean;
  };
};

const StyledTableRows = styled.div`
  padding-bottom: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledMemberIdentity = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const StyledEllipsis = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledEmpty = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: ${themeCssVariables.spacing[2]} 0 0;
`;

const StyledRoleSelect = styled.div`
  min-width: 160px;
`;

const getMemberDisplayName = (member: PendingWorkspaceMember) => {
  const name = [member.firstName, member.lastName]
    .filter(isNonEmptyString)
    .join(' ');

  return isNonEmptyString(name) ? name : member.email;
};

export const SettingsPendingWorkspaceMembers = () => {
  const { i18n, t } = useLingui();
  const { enqueueToast } = useToast();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');
  const canManageMembers = Boolean(
    useHasPermissionFlag(PermissionFlagType.WORKSPACE_MEMBERS),
  );
  const canManageRoles = Boolean(
    useHasPermissionFlag(PermissionFlagType.ROLES),
  );
  const canReviewMembers = canManageMembers || canManageRoles;
  const [roleIdByUserWorkspaceId, setRoleIdByUserWorkspaceId] = useState<
    Record<string, string>
  >({});
  const [pendingRequired, setPendingRequired] = useState<boolean | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  const { data, loading, refetch } =
    useQuery<PendingWorkspaceMemberApprovalSettingsQuery>(
      PENDING_WORKSPACE_MEMBER_APPROVAL_SETTINGS,
      { skip: !canReviewMembers },
    );

  const [approvePendingWorkspaceMember] = useMutation(
    APPROVE_PENDING_WORKSPACE_MEMBER,
  );
  const [rejectPendingWorkspaceMember] = useMutation(
    REJECT_PENDING_WORKSPACE_MEMBER,
  );
  const [updateWorkspaceMemberApprovalRequired] = useMutation(
    UPDATE_WORKSPACE_MEMBER_APPROVAL_REQUIRED,
  );

  if (!canReviewMembers) {
    return null;
  }

  const pendingMembers = data?.pendingWorkspaceMembers ?? [];
  const assignableRoles = data?.memberApprovalAssignableRoles ?? [];
  const defaultRoleId = assignableRoles[0]?.id;
  const isMemberApprovalRequired =
    pendingRequired ??
    data?.currentWorkspaceMemberApproval.isMemberApprovalRequired ??
    true;

  const text = (english: string, portuguese: string) =>
    isPortuguese ? portuguese : english;

  const handleRequiredChange = async (nextValue: boolean) => {
    setPendingRequired(nextValue);

    try {
      const result = await updateWorkspaceMemberApprovalRequired({
        variables: {
          input: { isMemberApprovalRequired: nextValue },
        },
      });

      if (isDefined(result.error)) {
        throw result.error;
      }

      setPendingRequired(null);
      await refetch();
    } catch (error) {
      setPendingRequired(null);
      enqueueToast(getToastOptionsFromError({ error }));
    }
  };

  const handleApprove = async (userWorkspaceId: string) => {
    const roleId = roleIdByUserWorkspaceId[userWorkspaceId] ?? defaultRoleId;

    if (!isDefined(roleId)) {
      return;
    }

    setPendingActionKey(`approve-${userWorkspaceId}`);

    try {
      const result = await approvePendingWorkspaceMember({
        variables: { userWorkspaceId, roleId },
      });

      if (isDefined(result.error)) {
        throw result.error;
      }

      enqueueToast({
        status: 'success',
        children: text(t`Member approved.`, doNotTranslate('Membro aprovado.')),
      });
      await refetch();
    } catch (error) {
      enqueueToast(getToastOptionsFromError({ error }));
    } finally {
      setPendingActionKey(null);
    }
  };

  const handleReject = async (userWorkspaceId: string) => {
    setPendingActionKey(`reject-${userWorkspaceId}`);

    try {
      const result = await rejectPendingWorkspaceMember({
        variables: { userWorkspaceId },
      });

      if (isDefined(result.error)) {
        throw result.error;
      }

      enqueueToast({
        status: 'success',
        children: text(t`Access rejected.`, doNotTranslate('Acesso recusado.')),
      });
      await refetch();
    } catch (error) {
      enqueueToast(getToastOptionsFromError({ error }));
    } finally {
      setPendingActionKey(null);
    }
  };

  return (
    <Section.Root>
      <Section.Header
        title={text(
          t`Pending approval`,
          doNotTranslate('Aguardando aprovação'),
        )}
        description={text(
          t`New members stay without access until an administrator approves them.`,
          doNotTranslate(
            'Novos membros ficam sem acesso até um administrador aprovar.',
          ),
        )}
      />
      {canManageMembers && (
        <Card.Root>
          <SettingsOptionCardContentSwitch
            Icon={IconUserPlus}
            title={text(
              t`Require approval for new members`,
              doNotTranslate('Exigir aprovação de novos membros'),
            )}
            description={text(
              t`Personal invitations are approved immediately. People who join through SSO or an allowed domain stay pending.`,
              doNotTranslate(
                'Convites pessoais entram aprovados. Quem entra por SSO ou domínio permitido fica pendente.',
              ),
            )}
            checked={isMemberApprovalRequired}
            disabled={loading && !isDefined(data)}
            onChange={handleRequiredChange}
          />
        </Card.Root>
      )}
      {pendingMembers.length === 0 ? (
        <StyledEmpty>
          {loading
            ? text(t`Loading…`, doNotTranslate('Carregando…'))
            : text(
                t`No members waiting for approval.`,
                doNotTranslate('Nenhum membro aguardando aprovação.'),
              )}
        </StyledEmpty>
      ) : (
        <Table>
          <TableRow gridAutoColumns="1.2fr 1fr 180px 220px">
            <TableHeader>{text(t`Name`, doNotTranslate('Nome'))}</TableHeader>
            <TableHeader>
              {text(t`Email`, doNotTranslate('E-mail'))}
            </TableHeader>
            <TableHeader>{text(t`Role`, doNotTranslate('Função'))}</TableHeader>
            <TableHeader></TableHeader>
          </TableRow>
          <StyledTableRows>
            {pendingMembers.map((member) => {
              const selectedRoleId =
                roleIdByUserWorkspaceId[member.userWorkspaceId] ??
                defaultRoleId;
              const isApproving =
                pendingActionKey === `approve-${member.userWorkspaceId}`;
              const isRejecting =
                pendingActionKey === `reject-${member.userWorkspaceId}`;

              return (
                <TableRow
                  key={member.userWorkspaceId}
                  gridAutoColumns="1.2fr 1fr 180px 220px"
                >
                  <TableCell color={themeCssVariables.font.color.primary}>
                    <StyledMemberIdentity>
                      <Tooltip
                        content={getMemberDisplayName(member)}
                        side="top"
                      >
                        <StyledEllipsis>
                          {getMemberDisplayName(member)}
                        </StyledEllipsis>
                      </Tooltip>
                    </StyledMemberIdentity>
                  </TableCell>
                  <TableCell>
                    <StyledEllipsis>{member.email}</StyledEllipsis>
                  </TableCell>
                  <TableCell>
                    <StyledRoleSelect>
                      <Select
                        dropdownId={`pending-member-role-${member.userWorkspaceId}`}
                        fullWidth
                        dropdownWidthAuto
                        label={text(t`Role`, 'Função')}
                        value={selectedRoleId}
                        options={assignableRoles.map((role) => ({
                          label: role.label,
                          value: role.id,
                        }))}
                        disabled={assignableRoles.length === 0}
                        onChange={(roleId) => {
                          setRoleIdByUserWorkspaceId(
                            (currentRoleIdByUserWorkspaceId) => ({
                              ...currentRoleIdByUserWorkspaceId,
                              [member.userWorkspaceId]: roleId,
                            }),
                          );
                        }}
                      />
                    </StyledRoleSelect>
                  </TableCell>
                  <TableCell align="right">
                    <StyledActions>
                      <Button
                        size="sm"
                        variant="solid"
                        color="success"
                        startIcon={<IconCheck size={14} />}
                        disabled={!isDefined(selectedRoleId)}
                        loading={isApproving}
                        onClick={() => {
                          void handleApprove(member.userWorkspaceId);
                        }}
                      >
                        {text(t`Approve`, doNotTranslate('Aprovar'))}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        color="danger"
                        loading={isRejecting}
                        onClick={() => {
                          void handleReject(member.userWorkspaceId);
                        }}
                      >
                        {text(t`Reject`, doNotTranslate('Recusar'))}
                      </Button>
                    </StyledActions>
                  </TableCell>
                </TableRow>
              );
            })}
          </StyledTableRows>
        </Table>
      )}
    </Section.Root>
  );
};
