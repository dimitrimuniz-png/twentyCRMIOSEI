import { useMutation } from '@apollo/client/react';

import {
  EditSsoIdentityProviderDocument,
  GetSsoIdentityProvidersDocument,
  type SsoIdentityProviderStatus,
} from '~/generated-metadata/graphql';

export const useUpdateSsoIdentityProvider = () => {
  const [mutate] = useMutation(EditSsoIdentityProviderDocument);

  const updateSsoIdentityProvider = async ({
    id,
    status,
  }: {
    id: string;
    status: SsoIdentityProviderStatus;
  }) => {
    try {
      await mutate({
        variables: { input: { id, status } },
        refetchQueries: [GetSsoIdentityProvidersDocument],
      });

      return { error: undefined };
    } catch (error) {
      return { error };
    }
  };

  return { updateSsoIdentityProvider };
};
