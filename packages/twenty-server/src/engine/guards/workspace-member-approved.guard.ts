import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { isWorkspaceMemberApproved } from 'src/engine/core-modules/user-workspace/utils/is-workspace-member-approved.util';
import { ALLOW_PENDING_WORKSPACE_MEMBER_KEY } from 'src/engine/guards/constants/allow-pending-workspace-member-key.constant';
import { getRequest } from 'src/utils/extract-request';

@Injectable()
export class WorkspaceMemberApprovedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = getRequest(context);

    if (isWorkspaceMemberApproved(request?.userWorkspace)) {
      return true;
    }

    if (this.isPendingMemberAllowed(context)) {
      return true;
    }

    throw new AuthException(
      'Workspace member approval is required',
      AuthExceptionCode.MEMBER_APPROVAL_REQUIRED,
    );
  }

  private isPendingMemberAllowed(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(
        ALLOW_PENDING_WORKSPACE_MEMBER_KEY,
        [context.getHandler(), context.getClass()],
      ) === true
    );
  }
}
