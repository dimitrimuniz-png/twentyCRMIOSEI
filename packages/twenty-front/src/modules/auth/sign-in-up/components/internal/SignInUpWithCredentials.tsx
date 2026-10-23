import { IoseiAuthFormAlert } from '@/auth/components/iosei-auth/IoseiAuthFormAlert';
import { IoseiAuthPrimaryButton } from '@/auth/components/iosei-auth/IoseiAuthPrimaryButton';
import { StyledIoseiAuthForm } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useHasMultipleAuthMethods } from '@/auth/sign-in-up/hooks/useHasMultipleAuthMethods';
import { useSignInUp } from '@/auth/sign-in-up/hooks/useSignInUp';
import { type Form } from '@/auth/sign-in-up/hooks/useSignInUpForm';
import { lastAuthenticatedMethodState } from '@/auth/states/lastAuthenticatedMethodState';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';

import { LastUsedPill } from '@/auth/sign-in-up/components/internal/LastUsedPill';
import { SignInUpEmailField } from '@/auth/sign-in-up/components/internal/SignInUpEmailField';
import { SignInUpPasswordField } from '@/auth/sign-in-up/components/internal/SignInUpPasswordField';
import { StyledSsoButtonContainer } from '@/auth/sign-in-up/components/internal/SignInUpSsoButtonStyles';
import { AuthenticatedMethod } from '@/auth/types/AuthenticatedMethod';
import { SignInUpMode } from '@/auth/types/SignInUpMode';
import { isRequestingCaptchaTokenState } from '@/captcha/states/isRequestingCaptchaTokenState';
import { captchaState } from '@/client-config/states/captchaState';
import { isDDLLockedState } from '@/client-config/states/isDDLLockedState';
import { InputHint } from '@/ui/input/components/internal/InputHint/InputHint';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { isDefined } from 'twenty-shared/utils';

export const SignInUpWithCredentials = ({
  isGlobalScope,
  beforeSubmit,
}: {
  isGlobalScope?: boolean;
  beforeSubmit?: ReactNode;
}) => {
  const { t, i18n } = useLingui();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');
  const form = useFormContext<Form>();

  const [signInUpStep, setSignInUpStep] = useAtomState(signInUpStepState);
  const [showErrors, setShowErrors] = useState(false);
  const captcha = useAtomStateValue(captchaState);
  const isDDLLocked = useAtomStateValue(isDDLLockedState);
  const isRequestingCaptchaToken = useAtomStateValue(
    isRequestingCaptchaTokenState,
  );
  const lastAuthenticatedMethod = useAtomStateValue(
    lastAuthenticatedMethodState,
  );
  const hasMultipleAuthMethods = useHasMultipleAuthMethods();

  const {
    signInUpMode,
    continueWithEmail,
    continueWithCredentials,
    submitCredentials,
  } = useSignInUp(form);

  const isLastUsed =
    signInUpStep === SignInUpStep.Init &&
    lastAuthenticatedMethod === AuthenticatedMethod.EMAIL &&
    (isGlobalScope || hasMultipleAuthMethods);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitButtonDisabled) return;

    if (signInUpStep === SignInUpStep.Init) {
      continueWithEmail();
    } else if (signInUpStep === SignInUpStep.Email) {
      if (isDefined(form?.formState?.errors?.email)) {
        setShowErrors(true);
        return;
      }
      continueWithCredentials();
    } else if (signInUpStep === SignInUpStep.Password) {
      if (!form.formState.isSubmitting) {
        setShowErrors(true);
        form.handleSubmit(submitCredentials)();
      }
    }
  };

  const onEmailChange = (email: string) => {
    if (email !== form.getValues('email')) {
      setSignInUpStep(SignInUpStep.Email);
    }
  };

  const buttonTitle = useMemo(() => {
    if (signInUpStep === SignInUpStep.Init) {
      return isPortuguese ? 'Continuar com e-mail' : t`Continue with Email`;
    }

    if (
      signInUpMode === SignInUpMode.SignIn &&
      signInUpStep === SignInUpStep.Password
    ) {
      return isPortuguese ? 'Entrar' : t`Sign in`;
    }

    if (
      signInUpMode === SignInUpMode.SignUp &&
      signInUpStep === SignInUpStep.Password
    ) {
      return isPortuguese ? 'Criar conta' : t`Sign up`;
    }

    return isPortuguese ? 'Continuar' : t`Continue`;
  }, [isPortuguese, signInUpMode, signInUpStep, t]);

  const shouldWaitForCaptchaToken =
    signInUpStep !== SignInUpStep.Init &&
    isDefined(captcha?.provider) &&
    isRequestingCaptchaToken;

  const isEmailStepSubmitButtonDisabledCondition =
    signInUpStep === SignInUpStep.Email &&
    (isDefined(form.formState.errors['email']) || shouldWaitForCaptchaToken);

  // TODO: isValid is actually a proxy function. If it is not rendered the first time, react might not trigger re-renders
  // We make the isValid check synchronous and update a reactState to make sure this does not happen
  const isPasswordStepSubmitButtonDisabledCondition =
    signInUpStep === SignInUpStep.Password &&
    (!form.formState.isValid ||
      form.formState.isSubmitting ||
      shouldWaitForCaptchaToken);

  const isSignUpBlockedByDDLLock =
    isDDLLocked &&
    signInUpMode === SignInUpMode.SignUp &&
    signInUpStep === SignInUpStep.Password;

  const isSubmitButtonDisabled =
    isEmailStepSubmitButtonDisabledCondition ||
    isPasswordStepSubmitButtonDisabledCondition ||
    isSignUpBlockedByDDLLock;

  return (
    <>
      {(signInUpStep === SignInUpStep.Password ||
        signInUpStep === SignInUpStep.Email ||
        signInUpStep === SignInUpStep.Init) && (
        <StyledIoseiAuthForm onSubmit={handleSubmit}>
          {signInUpStep !== SignInUpStep.Init && (
            <SignInUpEmailField
              showErrors={showErrors}
              onInputChange={onEmailChange}
              autoFocus={signInUpStep !== SignInUpStep.Password}
            />
          )}
          {signInUpStep === SignInUpStep.Password && (
            <SignInUpPasswordField
              showErrors={showErrors}
              signInUpMode={signInUpMode}
            />
          )}
          {beforeSubmit}
          <IoseiAuthFormAlert />
          <StyledSsoButtonContainer>
            <IoseiAuthPrimaryButton
              type="submit"
              loading={form.formState.isSubmitting}
              disabled={isSubmitButtonDisabled}
            >
              {buttonTitle}
            </IoseiAuthPrimaryButton>
            {isLastUsed && <LastUsedPill />}
            {isSignUpBlockedByDDLLock && (
              <InputHint>{t`Sign-up is temporarily unavailable during maintenance.`}</InputHint>
            )}
          </StyledSsoButtonContainer>
        </StyledIoseiAuthForm>
      )}
    </>
  );
};
