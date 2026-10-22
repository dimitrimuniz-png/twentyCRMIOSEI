import { useCallback } from 'react';

import { GET_AUTHORIZATION_URL_FOR_SSO } from '@/auth/graphql/mutations/getAuthorizationUrlForSSO';
import { useRedirect } from '@/domain-manager/hooks/useRedirect';
import { useMutation } from '@apollo/client/react';
import { t } from '@lingui/core/macro';
import { doNotTranslate } from 'twenty-shared/i18n';
import { useToast } from 'twenty-ui/components/feedback';
import {
  type GetAuthorizationUrlForSsoMutation,
  type GetAuthorizationUrlForSsoMutationVariables,
} from '~/generated-metadata/graphql';

export const useSso = () => {
  const { enqueueToast } = useToast();
  const { redirect } = useRedirect();
  const [getAuthorizationUrl] = useMutation<
    GetAuthorizationUrlForSsoMutation,
    GetAuthorizationUrlForSsoMutationVariables
  >(GET_AUTHORIZATION_URL_FOR_SSO);

  const redirectToSsoLoginPage = useCallback(
    async (identityProviderId: string) => {
      try {
        const result = await getAuthorizationUrl({
          variables: { input: { identityProviderId } },
        });
        const authorizationURL =
          result.data?.getAuthorizationUrlForSSO?.authorizationURL;

        if (!authorizationURL) {
          throw new Error(doNotTranslate('Missing SSO authorization URL'));
        }

        redirect(authorizationURL);
      } catch {
        enqueueToast({ status: 'error', children: t`An error occurred.` });
      }
    },
    [enqueueToast, getAuthorizationUrl, redirect],
  );

  return { redirectToSsoLoginPage };
};
