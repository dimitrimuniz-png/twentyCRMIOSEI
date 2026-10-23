import { StyledIoseiAuthWordmark } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { doNotTranslate } from 'twenty-shared/i18n';

type IoseiLogoProps = {
  onClick?: () => void;
};

// Text stand-in until the logo PNG is dropped in at
// packages/twenty-front/src/modules/auth/components/assets/iosei-logo.png
// (navy mark, 240px wide, on the white card).
export const IoseiLogo = ({ onClick }: IoseiLogoProps) => {
  return (
    <StyledIoseiAuthWordmark
      type="button"
      onClick={onClick}
      aria-label={doNotTranslate('IOSEI Global Operations')}
    >
      {doNotTranslate('IOSEI Global Operations')}
    </StyledIoseiAuthWordmark>
  );
};
