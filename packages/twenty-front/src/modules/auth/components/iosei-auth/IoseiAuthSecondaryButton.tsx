import { StyledIoseiAuthSecondaryButton } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { type ReactNode } from 'react';

type IoseiAuthSecondaryButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

export const IoseiAuthSecondaryButton = ({
  children,
  onClick,
  disabled = false,
}: IoseiAuthSecondaryButtonProps) => {
  return (
    <StyledIoseiAuthSecondaryButton
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </StyledIoseiAuthSecondaryButton>
  );
};
