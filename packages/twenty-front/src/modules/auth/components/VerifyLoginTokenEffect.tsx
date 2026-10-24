import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useIsLogged } from '@/auth/hooks/useIsLogged';
import { useVerifyLogin } from '@/auth/hooks/useVerifyLogin';
import {
  hasSubmittedLoginToken,
  markLoginTokenSubmitted,
} from '@/auth/utils/submittedLoginTokens';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useNavigateApp } from '~/hooks/useNavigateApp';

export const VerifyLoginTokenEffect = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const loginToken = searchParams.get('loginToken');

  const isLogged = useIsLogged();
  const navigate = useNavigateApp();
  const { verifyLoginToken } = useVerifyLogin();

  useEffect(() => {
    if (!isDefined(loginToken)) {
      if (!isLogged) {
        navigate(AppPath.SignInUp);
      }

      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.delete('loginToken');
    setSearchParams(nextSearchParams, { replace: true });

    if (hasSubmittedLoginToken(loginToken)) {
      return;
    }

    markLoginTokenSubmitted(loginToken);
    verifyLoginToken(loginToken);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
};
