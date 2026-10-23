import { isDefined } from 'twenty-shared/utils';

import { WorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/enums/workspace-member-approval-status.enum';

// A cache entry written before this column existed has no status. Treat that as
// approved so a deploy does not lock out members until the cache refreshes.
export const isWorkspaceMemberApproved = (
  userWorkspace:
    | { approvalStatus?: WorkspaceMemberApprovalStatus | null }
    | null
    | undefined,
): boolean => {
  if (!isDefined(userWorkspace) || !isDefined(userWorkspace.approvalStatus)) {
    return true;
  }

  return (
    userWorkspace.approvalStatus === WorkspaceMemberApprovalStatus.APPROVED
  );
};
