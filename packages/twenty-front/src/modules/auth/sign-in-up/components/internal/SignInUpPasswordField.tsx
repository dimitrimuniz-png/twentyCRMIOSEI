import { IoseiAuthPasswordField } from '@/auth/components/iosei-auth/IoseiAuthPasswordField';
import { type Form } from '@/auth/sign-in-up/hooks/useSignInUpForm';
import { SignInUpMode } from '@/auth/types/SignInUpMode';
import { useLingui } from '@lingui/react/macro';
import { Controller, useFormContext } from 'react-hook-form';
import { doNotTranslate } from 'twenty-shared/i18n';

export const SignInUpPasswordField = ({
  showErrors,
  signInUpMode,
  autoFocus = true,
}: {
  showErrors: boolean;
  signInUpMode: SignInUpMode;
  autoFocus?: boolean;
}) => {
  const { t, i18n } = useLingui();
  const form = useFormContext<Form>();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  return (
    <Controller
      name="password"
      control={form.control}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <IoseiAuthPasswordField
          id="sign-in-up-password"
          label={isPortuguese ? doNotTranslate('Senha') : t`Password`}
          autoFocus={autoFocus}
          autoComplete={
            signInUpMode === SignInUpMode.SignUp
              ? 'new-password'
              : 'current-password'
          }
          value={value}
          onBlur={onBlur}
          onChange={onChange}
          error={showErrors ? error?.message : undefined}
        />
      )}
    />
  );
};
