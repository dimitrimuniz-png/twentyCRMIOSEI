import { IoseiAuthFormAlert } from '@/auth/components/iosei-auth/IoseiAuthFormAlert';
import { IoseiAuthPrimaryButton } from '@/auth/components/iosei-auth/IoseiAuthPrimaryButton';
import {
  StyledIoseiAuthCheckbox,
  StyledIoseiAuthForm,
  StyledIoseiAuthRememberLabel,
  StyledIoseiAuthRememberRow,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { SignInUpEmailField } from '@/auth/sign-in-up/components/internal/SignInUpEmailField';
import { SignInUpPasswordField } from '@/auth/sign-in-up/components/internal/SignInUpPasswordField';
import { useSignInUp } from '@/auth/sign-in-up/hooks/useSignInUp';
import { type Form } from '@/auth/sign-in-up/hooks/useSignInUpForm';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';
import { SignInUpMode } from '@/auth/types/SignInUpMode';
import { PASSWORD_REGEX } from '@/auth/utils/passwordRegex';
import { isRequestingCaptchaTokenState } from '@/captcha/states/isRequestingCaptchaTokenState';
import { captchaState } from '@/client-config/states/captchaState';
import { isDDLLockedState } from '@/client-config/states/isDDLLockedState';
import { InputHint } from '@/ui/input/components/internal/InputHint/InputHint';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { type FormEvent, type ReactNode, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDefined } from 'twenty-shared/utils';
import { z } from 'zod';

const CREDENTIAL_STEPS = [
  SignInUpStep.Init,
  SignInUpStep.Email,
  SignInUpStep.Password,
];

export const SignInUpWithCredentials = ({
  beforeSubmit,
}: {
  isGlobalScope?: boolean;
  beforeSubmit?: ReactNode;
}) => {
  const { t, i18n } = useLingui();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');
  const form = useFormContext<Form>();

  const signInUpStep = useAtomStateValue(signInUpStepState);
  const [showErrors, setShowErrors] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captcha = useAtomStateValue(captchaState);
  const isDDLLocked = useAtomStateValue(isDDLLockedState);
  const isRequestingCaptchaToken = useAtomStateValue(
    isRequestingCaptchaTokenState,
  );

  const { signInUpMode, submitEmailAndPassword } = useSignInUp(form);

  const shouldWaitForCaptchaToken =
    isDefined(captcha?.provider) && isRequestingCaptchaToken;

  const isSignUpBlockedByDDLLock =
    isDDLLocked && signInUpMode === SignInUpMode.SignUp;

  const buttonTitle = isPortuguese ? doNotTranslate('Entrar') : t`Sign in`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || shouldWaitForCaptchaToken || isSignUpBlockedByDDLLock) {
      return;
    }

    const email = form.getValues('email')?.trim() ?? '';
    const password = form.getValues('password') ?? '';
    const emailIsValid = z.email().safeParse(email).success;
    let hasError = false;

    if (!emailIsValid) {
      form.setError('email', {
        type: 'manual',
        message: t`Email must be a valid email`,
      });
      hasError = true;
    } else {
      form.clearErrors('email');
    }

    if (!PASSWORD_REGEX.test(password)) {
      form.setError('password', {
        type: 'manual',
        message: t`Password must be between 8 and 50 characters`,
      });
      hasError = true;
    } else {
      form.clearErrors('password');
    }

    setShowErrors(true);

    if (hasError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitEmailAndPassword();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!CREDENTIAL_STEPS.includes(signInUpStep)) {
    return null;
  }

  return (
    <StyledIoseiAuthForm onSubmit={handleSubmit}>
      <SignInUpEmailField showErrors={showErrors} autoFocus />
      <SignInUpPasswordField
        showErrors={showErrors}
        signInUpMode={signInUpMode}
        autoFocus={false}
      />
      {/* The auth cookie already keeps the session. This matches the approved card and does not change that lifetime. */}
      <StyledIoseiAuthRememberRow>
        <StyledIoseiAuthRememberLabel>
          <StyledIoseiAuthCheckbox
            type="checkbox"
            checked={keepSignedIn}
            onChange={(event) => setKeepSignedIn(event.target.checked)}
          />
          {isPortuguese
            ? doNotTranslate('Manter-me conectado')
            : t`Keep me signed in`}
        </StyledIoseiAuthRememberLabel>
        {beforeSubmit}
      </StyledIoseiAuthRememberRow>
      <IoseiAuthFormAlert />
      <IoseiAuthPrimaryButton
        type="submit"
        loading={isSubmitting}
        disabled={shouldWaitForCaptchaToken || isSignUpBlockedByDDLLock}
      >
        {buttonTitle}
      </IoseiAuthPrimaryButton>
      {isSignUpBlockedByDDLLock && (
        <InputHint>{t`Sign-up is temporarily unavailable during maintenance.`}</InputHint>
      )}
    </StyledIoseiAuthForm>
  );
};
