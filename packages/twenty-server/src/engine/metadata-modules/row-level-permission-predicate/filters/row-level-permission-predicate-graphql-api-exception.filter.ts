import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import { type GqlContextType } from '@nestjs/graphql';

import { RowLevelPermissionPredicateException } from 'src/engine/metadata-modules/row-level-permission-predicate/exceptions/row-level-permission-predicate.exception';
import { rowLevelPermissionPredicateGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/row-level-permission-predicate/utils/row-level-permission-predicate-graphql-api-exception-handler.util';

@Catch(RowLevelPermissionPredicateException)
export class RowLevelPermissionPredicateGraphqlApiExceptionFilter implements ExceptionFilter {
  catch(
    exception: RowLevelPermissionPredicateException,
    host: ArgumentsHost,
  ): never {
    if (host.getType<GqlContextType>() !== 'graphql') {
      throw exception;
    }

    return rowLevelPermissionPredicateGraphqlApiExceptionHandler(exception);
  }
}
