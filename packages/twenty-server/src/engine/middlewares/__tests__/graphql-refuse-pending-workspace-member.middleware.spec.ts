import { type NextFunction, type Request, type Response } from 'express';

import { AuthExceptionCode } from 'src/engine/core-modules/auth/auth.exception';
import { WorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/enums/workspace-member-approval-status.enum';
import { GraphQLRefusePendingWorkspaceMemberMiddleware } from 'src/engine/middlewares/graphql-refuse-pending-workspace-member.middleware';
import { type MiddlewareService } from 'src/engine/middlewares/middleware.service';

describe('GraphQLRefusePendingWorkspaceMemberMiddleware', () => {
  let middlewareService: jest.Mocked<MiddlewareService>;
  let middleware: GraphQLRefusePendingWorkspaceMemberMiddleware;
  let next: NextFunction;

  const response = {} as Response;

  beforeEach(() => {
    middlewareService = {
      writeGraphqlResponseOnExceptionCaught: jest.fn(),
    } as unknown as jest.Mocked<MiddlewareService>;
    middleware = new GraphQLRefusePendingWorkspaceMemberMiddleware(
      middlewareService,
    );
    next = jest.fn();
  });

  it('refuses a pending member without calling next', () => {
    const request = {
      userWorkspace: { approvalStatus: WorkspaceMemberApprovalStatus.PENDING },
    } as unknown as Request;

    middleware.use(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(
      middlewareService.writeGraphqlResponseOnExceptionCaught,
    ).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        code: AuthExceptionCode.MEMBER_APPROVAL_REQUIRED,
      }),
    );
  });

  it('calls next when the member is approved or absent', () => {
    middleware.use({} as Request, response, next);

    expect(next).toHaveBeenCalled();
  });
});
