import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { getDomainFromEmail } from 'src/utils/get-domain-from-email';

const normalizeAllowedDomain = (domain: string): string =>
  domain.trim().toLowerCase().replace(/^@/, '');

export const isEmailInAllowedDomains = ({
  email,
  allowedDomains,
}: {
  email: string;
  allowedDomains: readonly string[] | undefined;
}): boolean => {
  const normalizedDomains = (allowedDomains ?? [])
    .map(normalizeAllowedDomain)
    .filter((domain) => domain.length > 0);

  if (normalizedDomains.length === 0) {
    return true;
  }

  const emailDomain = getDomainFromEmail(email.trim().toLowerCase());

  if (!isDefined(emailDomain) || emailDomain.length === 0) {
    return false;
  }

  return normalizedDomains.includes(emailDomain);
};

export const assertEmailDomainIsAllowed = ({
  email,
  allowedDomains,
}: {
  email: string;
  allowedDomains: readonly string[] | undefined;
}): void => {
  if (isEmailInAllowedDomains({ email, allowedDomains })) {
    return;
  }

  throw new AuthException(
    'Email domain is not allowed',
    AuthExceptionCode.FORBIDDEN_EXCEPTION,
    {
      userFriendlyMessage: msg`This email domain is not allowed to sign in.`,
    },
  );
};
