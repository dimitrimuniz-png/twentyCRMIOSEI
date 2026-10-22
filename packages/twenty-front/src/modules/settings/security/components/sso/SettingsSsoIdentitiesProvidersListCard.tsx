import { SettingsSecuritySsoRowDropdownMenu } from '@/settings/security/components/sso/SettingsSecuritySsoRowDropdownMenu';
import { useBuildServerUrl } from '@/settings/security/hooks/useBuildServerUrl';
import { buildOidcCallbackPath } from '@/settings/security/utils/buildServerUrl';
import { useSsoIdentityProviders } from '@/settings/security/hooks/useSsoIdentityProviders';
import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { Button } from 'twenty-ui/primitives/input';
import { Card } from 'twenty-ui/primitives/surfaces';

import { IdentityProviderType } from '~/generated-metadata/graphql';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

export const SettingsSsoIdentitiesProvidersListCard = () => {
  const { t } = useLingui();
  const navigateSettings = useNavigateSettings();
  const buildServerUrl = useBuildServerUrl();
  const { providers } = useSsoIdentityProviders();

  return (
    <Card.Root>
      <ul>
        {providers.map((provider) => (
          <li key={provider.id}>
            {provider.name} ({provider.type}) — {provider.status}
            {provider.type === IdentityProviderType.OIDC && (
              <div>{buildServerUrl(buildOidcCallbackPath(provider.id))}</div>
            )}
            <SettingsSecuritySsoRowDropdownMenu ssoIdp={provider} />
          </li>
        ))}
      </ul>
      <Button
        onClick={() => navigateSettings(SettingsPath.NewSsoIdentityProvider)}
      >
        {t`Add provider`}
      </Button>
    </Card.Root>
  );
};
