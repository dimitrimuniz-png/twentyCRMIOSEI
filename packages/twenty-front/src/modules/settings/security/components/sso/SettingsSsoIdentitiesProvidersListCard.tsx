import { SettingsSecuritySsoRowDropdownMenu } from '@/settings/security/components/sso/SettingsSecuritySsoRowDropdownMenu';
import { useSsoIdentityProviders } from '@/settings/security/hooks/useSsoIdentityProviders';
import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { Button } from 'twenty-ui/primitives/input';
import { Card } from 'twenty-ui/primitives/surfaces';

import { useNavigateSettings } from '~/hooks/useNavigateSettings';

export const SettingsSsoIdentitiesProvidersListCard = () => {
  const { t } = useLingui();
  const navigateSettings = useNavigateSettings();
  const { providers } = useSsoIdentityProviders();

  return (
    <Card.Root>
      <ul>
        {providers.map((provider) => (
          <li key={provider.id}>
            {provider.name} ({provider.type}) — {provider.status}
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
