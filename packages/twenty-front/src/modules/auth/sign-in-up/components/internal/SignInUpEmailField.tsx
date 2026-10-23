import { IoseiAuthTextField } from '@/auth/components/iosei-auth/IoseiAuthTextField';
import { type Form } from '@/auth/sign-in-up/hooks/useSignInUpForm';
import { useLingui } from '@lingui/react/macro';
import { Controller, useFormContext } from 'react-hook-form';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDefined } from 'twenty-shared/utils';

export const SignInUpEmailField = ({
  showErrors,
  onInputChange,
  autoFocus = true,
}: {
  showErrors: boolean;
  onInputChange?: (value: string) => void;
  autoFocus?: boolean;
}) => {
  const { t, i18n } = useLingui();
  const form = useFormContext<Form>();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  return (
    <Controller
      name="email"
      control={form.control}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <IoseiAuthTextField
          id="sign-in-up-email"
          label={isPortuguese ? 'E-mail' : t`Email`}
          autoComplete="email"
          autoFocus={autoFocus}
          type="email"
          value={value}
          placeholder={doNotTranslate('nome@iosei.co')}
          onBlur={onBlur}
          onChange={(email: string) => {
            if (isDefined(onInputChange)) onInputChange(email);
            onChange(email);
          }}
          error={showErrors ? error?.message : undefined}
        />
      )}
    />
  );
};
