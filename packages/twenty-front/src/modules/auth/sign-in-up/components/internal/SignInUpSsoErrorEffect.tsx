import { getSsoCallbackErrorMessage } from '@/auth/sign-in-up/utils/getSsoCallbackErrorMessage';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

export const SignInUpSsoErrorEffect = () => {
  const { i18n } = useLingui();
  const { enqueueToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const ssoError = searchParams.get('ssoError');

  useEffect(() => {
    if (!isDefined(ssoError) || ssoError.length === 0) {
      return;
    }

    enqueueToast({
      status: 'error',
      children: getSsoCallbackErrorMessage({
        ssoError,
        locale: i18n.locale,
        i18n,
      }),
      dedupeKey: `sso-error-${ssoError}`,
    });

    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.delete('ssoError');
    setSearchParams(nextSearchParams, { replace: true });
  }, [enqueueToast, i18n, searchParams, setSearchParams, ssoError]);

  return <></>;
};
