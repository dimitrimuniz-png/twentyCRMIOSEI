import { getSsoCallbackErrorMessage } from '@/auth/sign-in-up/utils/getSsoCallbackErrorMessage';
import { authFormAlertState } from '@/auth/states/authFormAlertState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

export const SignInUpSsoErrorEffect = () => {
  const { i18n } = useLingui();
  const setAuthFormAlert = useSetAtomState(authFormAlertState);
  const [searchParams, setSearchParams] = useSearchParams();
  const ssoError = searchParams.get('ssoError');

  useEffect(() => {
    if (!isDefined(ssoError) || ssoError.length === 0) {
      return;
    }

    setAuthFormAlert(
      getSsoCallbackErrorMessage({
        ssoError,
        locale: i18n.locale,
        i18n,
      }),
    );

    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.delete('ssoError');
    setSearchParams(nextSearchParams, { replace: true });
  }, [i18n, searchParams, setAuthFormAlert, setSearchParams, ssoError]);

  return <></>;
};
