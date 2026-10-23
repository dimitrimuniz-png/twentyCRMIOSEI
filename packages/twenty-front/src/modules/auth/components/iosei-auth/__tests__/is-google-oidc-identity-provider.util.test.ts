import {
  isGoogleOidcIdentityProvider,
  partitionSsoIdentityProviders,
} from '@/auth/components/iosei-auth/is-google-oidc-identity-provider.util';

describe('isGoogleOidcIdentityProvider', () => {
  it('matches an OIDC provider whose name or issuer mentions Google', () => {
    expect(
      isGoogleOidcIdentityProvider({
        id: 'google',
        name: 'Google',
        issuer: 'https://accounts.google.com',
        type: 'OIDC',
      }),
    ).toBe(true);

    expect(
      isGoogleOidcIdentityProvider({
        id: 'custom',
        name: 'Workspace SSO',
        issuer: 'https://accounts.google.com',
        type: 'OIDC',
      }),
    ).toBe(true);
  });

  it('leaves SAML and non-Google OIDC providers on the SSO link', () => {
    expect(
      isGoogleOidcIdentityProvider({
        id: 'saml-google',
        name: 'Google',
        issuer: 'https://accounts.google.com',
        type: 'SAML',
      }),
    ).toBe(false);

    expect(
      isGoogleOidcIdentityProvider({
        id: 'okta',
        name: 'Okta',
        issuer: 'https://iosei.okta.com',
        type: 'OIDC',
      }),
    ).toBe(false);
  });

  it('splits Google OIDC from the other identity providers', () => {
    const { googleOidcIdentityProviders, otherIdentityProviders } =
      partitionSsoIdentityProviders([
        {
          id: 'google',
          name: 'Google',
          issuer: 'https://accounts.google.com',
          type: 'OIDC',
        },
        {
          id: 'okta',
          name: 'Okta',
          issuer: 'https://iosei.okta.com',
          type: 'OIDC',
        },
      ]);

    expect(googleOidcIdentityProviders.map((provider) => provider.id)).toEqual([
      'google',
    ]);
    expect(otherIdentityProviders.map((provider) => provider.id)).toEqual([
      'okta',
    ]);
  });
});
