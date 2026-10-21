import { useEffect } from 'react';

import { ssoIdentitiesProvidersState } from '@/settings/security/states/ssoIdentitiesProvidersState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useQuery } from '@apollo/client/react';

import { GetSsoIdentityProvidersDocument } from '~/generated-metadata/graphql';

export const useSsoIdentityProviders = () => {
  const setProviders = useSetAtomState(ssoIdentitiesProvidersState);
  const query = useQuery(GetSsoIdentityProvidersDocument);
  const providers = query.data?.getSSOIdentityProviders ?? [];

  useEffect(() => {
    if (query.data?.getSSOIdentityProviders) {
      setProviders(query.data.getSSOIdentityProviders);
    }
  }, [query.data, setProviders]);

  return { providers, loading: query.loading };
};
