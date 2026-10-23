import { IoseiAuthSecondaryButton } from '@/auth/components/iosei-auth/IoseiAuthSecondaryButton';
import { partitionSsoIdentityProviders } from '@/auth/components/iosei-auth/is-google-oidc-identity-provider.util';
import { StyledIoseiAuthMethods } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useSso } from '@/auth/sign-in-up/hooks/useSso';
import { workspaceAuthProvidersState } from '@/workspace/states/workspaceAuthProvidersState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const SignInUpSsoIdentityProviderSelection = () => {
  const workspaceAuthProviders = useAtomStateValue(workspaceAuthProvidersState);
  const { redirectToSsoLoginPage } = useSso();
  const identityProviders = workspaceAuthProviders?.sso ?? [];
  const { googleOidcIdentityProviders, otherIdentityProviders } =
    partitionSsoIdentityProviders(identityProviders);
  const providers =
    googleOidcIdentityProviders.length === 1
      ? otherIdentityProviders
      : identityProviders;

  return (
    <StyledIoseiAuthMethods>
      {providers.map((provider) => (
        <IoseiAuthSecondaryButton
          key={provider.id}
          onClick={() => redirectToSsoLoginPage(provider.id)}
        >
          {provider.name}
        </IoseiAuthSecondaryButton>
      ))}
    </StyledIoseiAuthMethods>
  );
};
