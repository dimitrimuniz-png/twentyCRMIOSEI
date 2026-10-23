import { IoseiAuthPasswordField } from '@/auth/components/iosei-auth/IoseiAuthPasswordField';
import { IoseiAuthPrimaryButton } from '@/auth/components/iosei-auth/IoseiAuthPrimaryButton';
import { IoseiAuthShell } from '@/auth/components/iosei-auth/IoseiAuthShell';
import { IoseiAuthTextField } from '@/auth/components/iosei-auth/IoseiAuthTextField';
import { StyledIoseiAuthForm } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useAuth } from '@/auth/hooks/useAuth';
import { useIsLogged } from '@/auth/hooks/useIsLogged';
import { currentUserState } from '@/auth/states/currentUserState';
import { PASSWORD_REGEX } from '@/auth/utils/passwordRegex';
import { useReadCaptchaToken } from '@/captcha/hooks/useReadCaptchaToken';
import { useCaptcha } from '@/client-config/hooks/useCaptcha';
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { useRedirect } from '@/domain-manager/hooks/useRedirect';
import { getToastOptionsFromError } from '@/error-handler/utils/getToastOptionsFromError';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { useToast } from 'twenty-ui/components/feedback';
import { Loader } from 'twenty-ui/primitives/feedback';
import { z } from 'zod';
import {
  UpdatePasswordViaResetTokenDocument,
  ValidatePasswordResetTokenDocument,
} from '~/generated-metadata/graphql';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { logError } from '~/utils/logError';

const passwordLengthMessage = msg`Password must be between 8 and 50 characters`;

const validationSchema = z
  .object({
    passwordResetToken: z.string(),
    newPassword: z
      .string()
      .regex(PASSWORD_REGEX, i18n._(passwordLengthMessage)),
  })
  .required();

type Form = z.infer<typeof validationSchema>;

export const PasswordReset = () => {
  const { t, i18n: linguiI18n } = useLingui();
  const { enqueueToast } = useToast();
  const isPortuguese = linguiI18n.locale.toLowerCase().startsWith('pt');

  const setCurrentUser = useSetAtomState(currentUserState);

  const navigate = useNavigateApp();
  const { redirect } = useRedirect();

  const [email, setEmail] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isTargetUserPasswordSet, setIsTargetUserPasswordSet] = useState(false);
  const passwordResetToken = useParams().passwordResetToken;

  const isLogged = useIsLogged();

  const { control, handleSubmit } = useForm<Form>({
    mode: 'onChange',
    defaultValues: {
      passwordResetToken: passwordResetToken ?? '',
      newPassword: '',
    },
    resolver: zodResolver(validationSchema),
  });

  const { data: tokenValidationData, error: tokenValidationError } = useQuery(
    ValidatePasswordResetTokenDocument,
    {
      variables: {
        token: passwordResetToken ?? '',
      },
      skip: !passwordResetToken || isTokenValid,
    },
  );

  useEffect(() => {
    if (tokenValidationError) {
      enqueueToast(getToastOptionsFromError({ error: tokenValidationError }));
      navigate(AppPath.Index);
    }
  }, [tokenValidationError, enqueueToast, navigate]);

  useEffect(() => {
    if (tokenValidationData) {
      setIsTokenValid(true);
      const validationResult = tokenValidationData?.validatePasswordResetToken;
      if (isNonEmptyString(validationResult?.email)) {
        setEmail(validationResult.email);
      }
      if (validationResult?.hasPassword) {
        setIsTargetUserPasswordSet(validationResult.hasPassword);
      }
    }
  }, [tokenValidationData]);

  const [updatePasswordViaToken, { loading: isUpdatingPassword }] = useMutation(
    UpdatePasswordViaResetTokenDocument,
  );

  const { signInWithCredentialsInWorkspace, signInWithCredentials } = useAuth();
  const { isOnAWorkspace } = useIsCurrentLocationOnAWorkspace();
  const { readCaptchaToken } = useReadCaptchaToken();
  const { isCaptchaReady } = useCaptcha();

  const onSubmit = async (formData: Form) => {
    try {
      const { data } = await updatePasswordViaToken({
        variables: {
          token: formData.passwordResetToken,
          newPassword: formData.newPassword,
        },
      });

      if (!data?.updatePasswordViaResetToken.success) {
        enqueueToast({
          status: 'error',
          children: t`There was an error while updating password.`,
        });
        return;
      }

      const successMessage =
        isTargetUserPasswordSet === false
          ? t`Password has been set`
          : t`Password has been updated`;

      setCurrentUser((currentUser) =>
        currentUser ? { ...currentUser, hasPassword: true } : currentUser,
      );

      if (isLogged) {
        enqueueToast({ status: 'success', children: successMessage });
        navigate(AppPath.Index);
        return;
      }

      if (!isCaptchaReady) {
        enqueueToast({
          status: 'error',
          children: t`Captcha (anti-bot check) is still loading, try again`,
        });
        return;
      }

      const token = readCaptchaToken();

      if (isOnAWorkspace) {
        await signInWithCredentialsInWorkspace(
          email || '',
          formData.newPassword,
          token,
        );
      } else {
        await signInWithCredentials(email || '', formData.newPassword, token);
      }

      redirect(AppPath.Index);
    } catch (err) {
      logError(err);
      enqueueToast(getToastOptionsFromError({ error: err }));
    }
  };

  const passwordActionLabel =
    isTargetUserPasswordSet === true ? t`Change Password` : t`Set Password`;

  if (!isTokenValid) {
    return (
      <IoseiAuthShell>
        <Loader color="gray" />
      </IoseiAuthShell>
    );
  }

  return (
    <IoseiAuthShell title={passwordActionLabel}>
      {!email ? (
        <Loader color="gray" />
      ) : (
        <StyledIoseiAuthForm onSubmit={handleSubmit(onSubmit)}>
          <IoseiAuthTextField
            id="password-reset-email"
            label={isPortuguese ? 'E-mail' : t`Email`}
            value={email}
            onChange={() => undefined}
            disabled
          />
          <Controller
            name="newPassword"
            control={control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <IoseiAuthPasswordField
                id="password-reset-new-password"
                label={isPortuguese ? 'Nova senha' : t`New Password`}
                autoFocus
                autoComplete="new-password"
                value={value}
                onBlur={onBlur}
                onChange={onChange}
                error={error?.message}
              />
            )}
          />
          <IoseiAuthPrimaryButton
            type="submit"
            disabled={isUpdatingPassword}
            loading={isUpdatingPassword}
          >
            {passwordActionLabel}
          </IoseiAuthPrimaryButton>
        </StyledIoseiAuthForm>
      )}
    </IoseiAuthShell>
  );
};
