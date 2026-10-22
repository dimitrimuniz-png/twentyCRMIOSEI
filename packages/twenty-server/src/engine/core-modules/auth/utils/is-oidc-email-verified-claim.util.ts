import { isDefined } from 'twenty-shared/utils';

// Absent means the IdP did not make a claim. An explicit false is a rejection.
export const isOidcEmailVerifiedClaim = (emailVerified: unknown): boolean => {
  if (!isDefined(emailVerified)) {
    return true;
  }

  return emailVerified === true || emailVerified === 'true';
};
