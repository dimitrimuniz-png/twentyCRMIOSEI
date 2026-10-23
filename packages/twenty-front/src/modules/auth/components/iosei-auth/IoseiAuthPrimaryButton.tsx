import {
  StyledIoseiAuthButtonLabel,
  StyledIoseiAuthPrimaryButton,
  StyledIoseiAuthSpinner,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { type ReactNode } from 'react';

type IoseiAuthPrimaryButtonProps = {
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
};

export const IoseiAuthPrimaryButton = ({
  children,
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
}: IoseiAuthPrimaryButtonProps) => {
  return (
    <StyledIoseiAuthPrimaryButton
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={
        loading && typeof children === 'string' ? children : undefined
      }
      onClick={onClick}
    >
      <StyledIoseiAuthButtonLabel data-loading={loading ? 'true' : undefined}>
        {children}
      </StyledIoseiAuthButtonLabel>
      {loading && <StyledIoseiAuthSpinner aria-hidden />}
    </StyledIoseiAuthPrimaryButton>
  );
};
