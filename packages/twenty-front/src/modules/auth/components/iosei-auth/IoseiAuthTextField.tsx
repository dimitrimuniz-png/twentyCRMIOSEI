import {
  StyledIoseiAuthField,
  StyledIoseiAuthFieldHint,
  StyledIoseiAuthFieldMessage,
  StyledIoseiAuthInput,
  StyledIoseiAuthLabel,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { isNonEmptyString } from '@sniptt/guards';

type IoseiAuthTextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: 'email' | 'text';
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
};

export const IoseiAuthTextField = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  autoComplete,
  autoFocus,
  disabled,
  error,
  hint,
}: IoseiAuthTextFieldProps) => {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = isNonEmptyString(error);
  const hasHint = isNonEmptyString(hint) && !hasError;

  return (
    <StyledIoseiAuthField>
      <StyledIoseiAuthLabel htmlFor={id}>{label}</StyledIoseiAuthLabel>
      <StyledIoseiAuthInput
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect="off"
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : hasHint ? hintId : undefined}
        data-invalid={hasError ? 'true' : undefined}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
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
