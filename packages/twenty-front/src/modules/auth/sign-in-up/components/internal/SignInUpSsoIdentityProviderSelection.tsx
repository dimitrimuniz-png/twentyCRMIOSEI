import { useSso } from '@/auth/sign-in-up/hooks/useSso';
import { workspaceAuthProvidersState } from '@/workspace/states/workspaceAuthProvidersState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { MainButton } from 'twenty-ui/components/input';

export const SignInUpSsoIdentityProviderSelection = () => {
  const { t } = useLingui();
  const workspaceAuthProviders = useAtomStateValue(workspaceAuthProvidersState);
  const { redirectToSsoLoginPage } = useSso();
  const providers = workspaceAuthProviders?.sso ?? [];

  return (
    <div>
      <p>{t`Choose an identity provider`}</p>
      {providers.map((provider) => (
        <MainButton
          key={provider.id}
          fullWidth
          onClick={() => redirectToSsoLoginPage(provider.id)}
        >
          {provider.name}
        </MainButton>
      ))}
    </div>
  );
};
