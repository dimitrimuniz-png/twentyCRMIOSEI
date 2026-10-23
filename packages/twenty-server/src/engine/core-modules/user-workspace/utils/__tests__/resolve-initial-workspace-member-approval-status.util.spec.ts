import { WorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/enums/workspace-member-approval-status.enum';
import { resolveInitialWorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/utils/resolve-initial-workspace-member-approval-status.util';

describe('resolveInitialWorkspaceMemberApprovalStatus', () => {
  it('approves the workspace creator even when approval is required', () => {
    expect(
      resolveInitialWorkspaceMemberApprovalStatus({
        isMemberApprovalRequired: true,
        isWorkspaceCreator: true,
        isExplicitlyInvited: false,
      }),
    ).toBe(WorkspaceMemberApprovalStatus.APPROVED);
  });

  it('approves an explicitly invited member', () => {
    expect(
      resolveInitialWorkspaceMemberApprovalStatus({
        isMemberApprovalRequired: true,
        isWorkspaceCreator: false,
        isExplicitlyInvited: true,
      }),
    ).toBe(WorkspaceMemberApprovalStatus.APPROVED);
  });

  it('leaves a self-serve join pending when approval is required', () => {
    expect(
      resolveInitialWorkspaceMemberApprovalStatus({
        isMemberApprovalRequired: true,
        isWorkspaceCreator: false,
        isExplicitlyInvited: false,
      }),
    ).toBe(WorkspaceMemberApprovalStatus.PENDING);
  });

  it('approves every new member when the workspace setting is off', () => {
    expect(
      resolveInitialWorkspaceMemberApprovalStatus({
        isMemberApprovalRequired: false,
        isWorkspaceCreator: false,
        isExplicitlyInvited: false,
      }),
    ).toBe(WorkspaceMemberApprovalStatus.APPROVED);
  });
});
