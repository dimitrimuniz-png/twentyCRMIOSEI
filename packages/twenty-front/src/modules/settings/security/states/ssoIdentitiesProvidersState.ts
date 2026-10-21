import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

import { type SsoIdentityProvider } from '@/settings/security/types/SsoIdentityProvider';

export const ssoIdentitiesProvidersState = createAtomState<
  SsoIdentityProvider[]
>({
  key: 'ssoIdentitiesProvidersState',
  defaultValue: [],
});
