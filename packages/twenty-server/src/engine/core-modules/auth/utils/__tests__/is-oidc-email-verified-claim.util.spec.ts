import { isOidcEmailVerifiedClaim } from 'src/engine/core-modules/auth/utils/is-oidc-email-verified-claim.util';

describe('isOidcEmailVerifiedClaim', () => {
  it('accepts a missing claim and an explicit verified claim', () => {
    expect(isOidcEmailVerifiedClaim(undefined)).toBe(true);
    expect(isOidcEmailVerifiedClaim(null)).toBe(true);
    expect(isOidcEmailVerifiedClaim(true)).toBe(true);
    expect(isOidcEmailVerifiedClaim('true')).toBe(true);
  });

  it('rejects an explicit unverified claim', () => {
    expect(isOidcEmailVerifiedClaim(false)).toBe(false);
    expect(isOidcEmailVerifiedClaim('false')).toBe(false);
    expect(isOidcEmailVerifiedClaim(1)).toBe(false);
  });
});
