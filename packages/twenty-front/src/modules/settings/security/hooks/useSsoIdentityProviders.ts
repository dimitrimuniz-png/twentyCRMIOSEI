import { useEffect } from 'react';

import { ssoIdentitiesProvidersState } from '@/settings/security/states/ssoIdentitiesProvidersState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useQuery } from '@apollo/client/react';

import { GetSsoIdentityProvidersDocument } from '~/generated-metadata/graphql';

export const useSsoIdentityProviders = () => {
  const setSsoIdentitiesProviders = useSetAtomState(
    ssoIdentitiesProvidersState,
  );
  const query = useQuery(GetSsoIdentityProvidersDocument);
  const providers = query.data?.getSSOIdentityProviders ?? [];

  useEffect(() => {
    if (query.data?.getSSOIdentityProviders) {
      setSsoIdentitiesProviders(query.data.getSSOIdentityProviders);
    }
  }, [query.data, setSsoIdentitiesProviders]);

  return { providers, loading: query.loading };
};
