export type SsoIdentityProviderLike = {
  id: string;
  issuer: string;
  name: string;
  type: string;
};

// This deployment's Google login is an OIDC identity provider. A second
// "Continue with Google" button would start the same login twice.
export const isGoogleOidcIdentityProvider = (
  identityProvider: SsoIdentityProviderLike,
): boolean => {
  if (identityProvider.type !== 'OIDC') {
    return false;
  }

  const haystack =
    `${identityProvider.name} ${identityProvider.issuer}`.toLowerCase();

  return haystack.includes('google');
};

export const partitionSsoIdentityProviders = <
  TIdentityProvider extends SsoIdentityProviderLike,
>(
  identityProviders: TIdentityProvider[],
) => {
  const googleOidcIdentityProviders = identityProviders.filter(
    isGoogleOidcIdentityProvider,
  );
  const otherIdentityProviders = identityProviders.filter(
    (identityProvider) => !isGoogleOidcIdentityProvider(identityProvider),
  );

  return { googleOidcIdentityProviders, otherIdentityProviders };
};
