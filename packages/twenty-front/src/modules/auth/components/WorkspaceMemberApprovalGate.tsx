import { WaitingForWorkspaceMemberApproval } from '@/auth/components/WaitingForWorkspaceMemberApproval';
import { useIsLogged } from '@/auth/hooks/useIsLogged';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { type ReactNode } from 'react';
import { isDefined } from 'twenty-shared/utils';

const CURRENT_WORKSPACE_MEMBER_APPROVAL = gql`
  query CurrentWorkspaceMemberApproval {
    currentWorkspaceMemberApproval {
      approvalStatus
      isMemberApprovalRequired
    }
  }
`;

type CurrentWorkspaceMemberApprovalQuery = {
  currentWorkspaceMemberApproval: {
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    isMemberApprovalRequired: boolean;
  };
};

type WorkspaceMemberApprovalGateProps = {
  children: ReactNode;
};

export const WorkspaceMemberApprovalGate = ({
  children,
}: WorkspaceMemberApprovalGateProps) => {
  const isLogged = useIsLogged();
  const { data, loading, error, refetch } =
    useQuery<CurrentWorkspaceMemberApprovalQuery>(
      CURRENT_WORKSPACE_MEMBER_APPROVAL,
      {
        skip: !isLogged,
        fetchPolicy: 'network-only',
      },
    );

  if (!isLogged) {
    return children;
  }

  const approvalStatus = data?.currentWorkspaceMemberApproval.approvalStatus;
  const isPending =
    approvalStatus === 'PENDING' || approvalStatus === 'REJECTED';

  if (!isPending && !error && (loading || !isDefined(approvalStatus))) {
    return (
      <WaitingForWorkspaceMemberApproval
        isLoading
        onCheckAgain={() => {
          void refetch();
        }}
      />
    );
  }

  if (isPending || isDefined(error)) {
    return (
      <WaitingForWorkspaceMemberApproval
        onCheckAgain={() => {
          void refetch();
        }}
      />
    );
  }

  return children;
};
