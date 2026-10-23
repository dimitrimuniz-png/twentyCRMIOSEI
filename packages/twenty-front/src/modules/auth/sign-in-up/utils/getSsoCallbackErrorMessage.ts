import { type I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

const SSO_ERROR_COPY = {
  EMAIL_DOMAIN_NOT_ALLOWED: {
    pt: 'Este domínio de e-mail não tem permissão para entrar.',
    en: msg`This email domain is not allowed to sign in.`,
  },
  generic: {
    pt: 'O login com SSO falhou. Tente de novo ou fale com um administrador.',
    en: msg`Single sign-on failed. Try again or contact an administrator.`,
  },
} as const;

export const getSsoCallbackErrorMessage = ({
  ssoError,
  locale,
  i18n,
}: {
  ssoError: string;
  locale: string;
  i18n: I18n;
}): string => {
  const copy =
    ssoError === 'EMAIL_DOMAIN_NOT_ALLOWED'
      ? SSO_ERROR_COPY.EMAIL_DOMAIN_NOT_ALLOWED
      : SSO_ERROR_COPY.generic;

  if (locale.toLowerCase().startsWith('pt')) {
    return copy.pt;
  }

  return i18n._(copy.en);
};
