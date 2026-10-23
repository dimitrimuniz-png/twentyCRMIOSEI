import { Injectable, type NestMiddleware } from '@nestjs/common';

import { type NextFunction, type Request, type Response } from 'express';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { isWorkspaceMemberApproved } from 'src/engine/core-modules/user-workspace/utils/is-workspace-member-approved.util';
import { MiddlewareService } from 'src/engine/middlewares/middleware.service';

@Injectable()
export class GraphQLRefusePendingWorkspaceMemberMiddleware implements NestMiddleware {
  constructor(private readonly middlewareService: MiddlewareService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (isWorkspaceMemberApproved(req.userWorkspace)) {
      next();

      return;
    }

    this.middlewareService.writeGraphqlResponseOnExceptionCaught(
      res,
      new AuthException(
        'Workspace member approval is required',
        AuthExceptionCode.MEMBER_APPROVAL_REQUIRED,
      ),
    );
  }
}
