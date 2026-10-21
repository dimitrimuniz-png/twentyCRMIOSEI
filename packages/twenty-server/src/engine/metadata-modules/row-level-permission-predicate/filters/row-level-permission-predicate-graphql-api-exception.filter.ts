import { Catch, type ExceptionFilter } from '@nestjs/common';
import { GraphQLError } from 'graphql';

import { RowLevelPermissionPredicateException } from 'src/engine/metadata-modules/row-level-permission-predicate/exceptions/row-level-permission-predicate.exception';

@Catch(RowLevelPermissionPredicateException)
export class RowLevelPermissionPredicateGraphqlApiExceptionFilter
  implements ExceptionFilter
{
  catch(exception: RowLevelPermissionPredicateException): never {
    throw new GraphQLError(exception.message, {
      extensions: { code: 'ROW_LEVEL_PERMISSION_PREDICATE_INVALID' },
    });
  }
}
