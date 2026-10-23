import { WorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/enums/workspace-member-approval-status.enum';

export const resolveInitialWorkspaceMemberApprovalStatus = ({
  isMemberApprovalRequired,
  isWorkspaceCreator,
  isExplicitlyInvited,
}: {
  isMemberApprovalRequired: boolean;
  isWorkspaceCreator: boolean;
  isExplicitlyInvited: boolean;
}): WorkspaceMemberApprovalStatus => {
  if (!isMemberApprovalRequired || isWorkspaceCreator || isExplicitlyInvited) {
    return WorkspaceMemberApprovalStatus.APPROVED;
  }

  return WorkspaceMemberApprovalStatus.PENDING;
};
