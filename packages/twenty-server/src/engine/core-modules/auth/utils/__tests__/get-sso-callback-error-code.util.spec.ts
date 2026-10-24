import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { getSsoCallbackErrorCode } from 'src/engine/core-modules/auth/utils/get-sso-callback-error-code.util';

describe('getSsoCallbackErrorCode', () => {
  it('maps a blocked email domain to the login-card code', () => {
    expect(
      getSsoCallbackErrorCode(
        new AuthException(
          'Email domain is not allowed',
          AuthExceptionCode.FORBIDDEN_EXCEPTION,
        ),
      ),
    ).toBe('EMAIL_DOMAIN_NOT_ALLOWED');
  });

  it('keeps other auth exception codes', () => {
    expect(
      getSsoCallbackErrorCode(
        new AuthException(
          'Single sign-on authentication failed.',
          AuthExceptionCode.SSO_AUTH_FAILED,
        ),
      ),
    ).toBe(AuthExceptionCode.SSO_AUTH_FAILED);
  });

  it('hides provider failures such as a missing iss behind the generic code', () => {
    expect(
      getSsoCallbackErrorCode(new Error('iss missing from the response')),
    ).toBe(AuthExceptionCode.SSO_AUTH_FAILED);
    expect(getSsoCallbackErrorCode(undefined)).toBe(
      AuthExceptionCode.SSO_AUTH_FAILED,
    );
  });
});
