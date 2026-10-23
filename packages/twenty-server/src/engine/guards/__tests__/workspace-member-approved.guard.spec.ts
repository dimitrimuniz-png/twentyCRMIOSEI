import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { WorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/enums/workspace-member-approval-status.enum';
import { ALLOW_PENDING_WORKSPACE_MEMBER_KEY } from 'src/engine/guards/constants/allow-pending-workspace-member-key.constant';
import { WorkspaceMemberApprovedGuard } from 'src/engine/guards/workspace-member-approved.guard';

const buildContext = ({
  userWorkspace,
  isPendingMemberAllowed = false,
}: {
  userWorkspace?: { approvalStatus?: WorkspaceMemberApprovalStatus };
  isPendingMemberAllowed?: boolean;
}) => {
  const reflector = new Reflector();

  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockImplementation((key) =>
      key === ALLOW_PENDING_WORKSPACE_MEMBER_KEY
        ? isPendingMemberAllowed
        : undefined,
    );

  const request = { userWorkspace };
  const context = {
    getType: () => 'http',
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { guard: new WorkspaceMemberApprovedGuard(reflector), context };
};

describe('WorkspaceMemberApprovedGuard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows an approved member', () => {
    const { guard, context } = buildContext({
      userWorkspace: { approvalStatus: WorkspaceMemberApprovalStatus.APPROVED },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a request with no workspace member, such as an API key', () => {
    const { guard, context } = buildContext({});

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a pending member on an explicitly allowed handler', () => {
    const { guard, context } = buildContext({
      userWorkspace: { approvalStatus: WorkspaceMemberApprovalStatus.PENDING },
      isPendingMemberAllowed: true,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('refuses a pending member', () => {
    const { guard, context } = buildContext({
      userWorkspace: { approvalStatus: WorkspaceMemberApprovalStatus.PENDING },
    });

    expect(() => guard.canActivate(context)).toThrow(AuthException);
    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({
        code: AuthExceptionCode.MEMBER_APPROVAL_REQUIRED,
      }),
    );
  });
});
