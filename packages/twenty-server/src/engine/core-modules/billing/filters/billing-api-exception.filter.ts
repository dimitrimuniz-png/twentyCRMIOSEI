import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import { type Response } from 'express';

import { BillingException } from 'src/engine/core-modules/billing/billing.exception';

@Catch(BillingException)
export class BillingRestApiExceptionFilter implements ExceptionFilter {
  catch(exception: BillingException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.FORBIDDEN).json({
      statusCode: HttpStatus.FORBIDDEN,
      error: exception.code,
      messages: [exception.message],
    });
  }
}
