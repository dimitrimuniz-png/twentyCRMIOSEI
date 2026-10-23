import { StyledIoseiAuthTextLink } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { type ReactNode } from 'react';

type IoseiAuthTextLinkProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

export const IoseiAuthTextLink = ({
  children,
  onClick,
  disabled = false,
}: IoseiAuthTextLinkProps) => {
  return (
    <StyledIoseiAuthTextLink
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </StyledIoseiAuthTextLink>
  );
};
