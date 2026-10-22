import { Catch, type ExceptionFilter } from '@nestjs/common';

import { ConflictError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  SsoException,
  SsoExceptionCode,
} from 'src/engine/core-modules/sso/sso.exception';

@Catch(SsoException)
export class SsoGraphqlApiExceptionFilter implements ExceptionFilter {
  catch(exception: SsoException): never {
    switch (exception.code) {
      case SsoExceptionCode.IDENTITY_PROVIDER_ALREADY_EXISTS:
        throw new ConflictError(exception);
      default:
        throw exception;
    }
  }
}
