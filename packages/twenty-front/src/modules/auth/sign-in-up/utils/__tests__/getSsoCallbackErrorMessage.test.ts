import { i18n } from '@lingui/core';

import { getSsoCallbackErrorMessage } from '@/auth/sign-in-up/utils/getSsoCallbackErrorMessage';

describe('getSsoCallbackErrorMessage', () => {
  it('returns the Portuguese domain message', () => {
    expect(
      getSsoCallbackErrorMessage({
        ssoError: 'EMAIL_DOMAIN_NOT_ALLOWED',
        locale: 'pt-BR',
        i18n,
      }),
    ).toBe('Este domínio de e-mail não tem permissão para entrar.');
  });

  it('returns the English domain message', () => {
    expect(
      getSsoCallbackErrorMessage({
        ssoError: 'EMAIL_DOMAIN_NOT_ALLOWED',
        locale: 'en',
        i18n,
      }),
    ).toBe('This email domain is not allowed to sign in.');
  });

  it('returns a generic Portuguese message for other SSO errors', () => {
    expect(
      getSsoCallbackErrorMessage({
        ssoError: 'SSO_AUTH_FAILED',
        locale: 'pt',
        i18n,
      }),
    ).toBe(
      'O login com SSO falhou. Tente de novo ou fale com um administrador.',
    );
  });
});
