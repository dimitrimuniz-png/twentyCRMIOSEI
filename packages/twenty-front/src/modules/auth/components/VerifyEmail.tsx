import { IoseiAuthShell } from '@/auth/components/iosei-auth/IoseiAuthShell';
import { VerifyEmailEffect } from '@/auth/components/VerifyEmailEffect';
import { EmailVerificationSent } from '@/auth/sign-in-up/components/EmailVerificationSent';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader } from 'twenty-ui/primitives/feedback';

export const VerifyEmail = () => {
  const { t } = useLingui();
  const [searchParams] = useSearchParams();
  const [isError, setIsError] = useState(false);

  const email = searchParams.get('email');

  if (isError) {
    return (
      <IoseiAuthShell>
        <EmailVerificationSent email={email} isError={true} />
      </IoseiAuthShell>
    );
  }

  return (
    <IoseiAuthShell
      title={t`Verifying your email`}
      subtitle={email ?? undefined}
    >
      <VerifyEmailEffect onError={() => setIsError(true)} />
      <Loader color="gray" />
    </IoseiAuthShell>
  );
};
