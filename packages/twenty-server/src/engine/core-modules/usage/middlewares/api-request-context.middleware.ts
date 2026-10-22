import { type NestMiddleware } from '@nestjs/common';

import { type NextFunction, type Request, type Response } from 'express';

// Usage metering shipped with the commercial module. The middleware stays on
// the API routes, so it still has to hand the request to the next handler.
export class ApiRequestContextMiddleware implements NestMiddleware {
  use(_request: Request, _response: Response, next: NextFunction): void {
    next();
  }
}
