import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';

export const getSsoCallbackErrorCode = (error: unknown): string => {
  if (error instanceof AuthException) {
    if (error.message === 'Email domain is not allowed') {
      return 'EMAIL_DOMAIN_NOT_ALLOWED';
    }

    return error.code;
  }

  return AuthExceptionCode.SSO_AUTH_FAILED;
};
