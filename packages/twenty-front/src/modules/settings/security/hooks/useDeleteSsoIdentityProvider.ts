import { useMutation } from '@apollo/client/react';

import {
  DeleteSsoIdentityProviderDocument,
  GetSsoIdentityProvidersDocument,
} from '~/generated-metadata/graphql';

export const useDeleteSsoIdentityProvider = () => {
  const [mutate] = useMutation(DeleteSsoIdentityProviderDocument);

  const deleteSsoIdentityProvider = async ({
    identityProviderId,
  }: {
    identityProviderId: string;
  }) => {
    try {
      await mutate({
        variables: { input: { identityProviderId } },
        refetchQueries: [GetSsoIdentityProvidersDocument],
      });

      return { error: undefined };
    } catch (error) {
      return { error };
    }
  };

  return { deleteSsoIdentityProvider };
};
