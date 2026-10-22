import { Catch, type ExceptionFilter } from '@nestjs/common';

import { BillingException } from 'src/engine/core-modules/billing/billing.exception';
import { ForbiddenError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';

// Only billing failures belong here. A filter without @Catch matches every
// exception and, when catch() writes nothing, Nest treats the request as handled.
@Catch(BillingException)
export class BillingGraphqlApiExceptionFilter implements ExceptionFilter {
  catch(exception: BillingException): void {
    throw new ForbiddenError(exception);
  }
}
