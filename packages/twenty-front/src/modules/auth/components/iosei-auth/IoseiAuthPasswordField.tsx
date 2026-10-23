import {
  StyledIoseiAuthEyeButton,
  StyledIoseiAuthField,
  StyledIoseiAuthFieldHint,
  StyledIoseiAuthFieldMessage,
  StyledIoseiAuthLabel,
  StyledIoseiAuthPasswordControl,
  StyledIoseiAuthPasswordInput,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { isNonEmptyString } from '@sniptt/guards';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { IconEye, IconEyeOff } from 'twenty-ui/icon';

type IoseiAuthPasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
};

export const IoseiAuthPasswordField = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  autoComplete,
  autoFocus,
  disabled,
  error,
  hint,
  placeholder,
}: IoseiAuthPasswordFieldProps) => {
  const { t, i18n } = useLingui();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = isNonEmptyString(error);
  const hasHint = isNonEmptyString(hint) && !hasError;
  const showPasswordLabel = isPortuguese ? 'Mostrar senha' : t`Show password`;
  const hidePasswordLabel = isPortuguese ? 'Ocultar senha' : t`Hide password`;
  const eyeLabel = isPasswordVisible ? hidePasswordLabel : showPasswordLabel;

  return (
    <StyledIoseiAuthField>
      <StyledIoseiAuthLabel htmlFor={id}>{label}</StyledIoseiAuthLabel>
      <StyledIoseiAuthPasswordControl
        data-invalid={hasError ? 'true' : undefined}
      >
        <StyledIoseiAuthPasswordInput
          id={id}
          name={id}
          type={isPasswordVisible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : hasHint ? hintId : undefined}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
        <StyledIoseiAuthEyeButton
          type="button"
          aria-label={eyeLabel}
          onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
        >
          {isPasswordVisible ? (
            <IconEyeOff size={20} stroke={1.8} aria-hidden />
          ) : (
            <IconEye size={20} stroke={1.8} aria-hidden />
          )}
        </StyledIoseiAuthEyeButton>
      </StyledIoseiAuthPasswordControl>
      {hasError && (
        <StyledIoseiAuthFieldMessage id={errorId} role="alert">
          {error}
        </StyledIoseiAuthFieldMessage>
      )}
      {hasHint && (
        <StyledIoseiAuthFieldHint id={hintId}>{hint}</StyledIoseiAuthFieldHint>
      )}
    </StyledIoseiAuthField>
  );
};
