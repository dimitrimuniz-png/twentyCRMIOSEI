import ioseiLogoUrl from '@/auth/components/assets/iosei-logo.png';
import {
  StyledIoseiAuthLogoButton,
  StyledIoseiAuthLogoFrame,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDefined } from 'twenty-shared/utils';

type IoseiLogoProps = {
  onClick?: () => void;
};

const IOSEI_LOGO_ALT = doNotTranslate('IOSEI Global Operations');

export const IoseiLogo = ({ onClick }: IoseiLogoProps) => {
  if (!isDefined(onClick)) {
    return (
      <StyledIoseiAuthLogoFrame>
        <img src={ioseiLogoUrl} alt={IOSEI_LOGO_ALT} width={240} />
      </StyledIoseiAuthLogoFrame>
    );
  }

  return (
    <StyledIoseiAuthLogoButton
      type="button"
      onClick={onClick}
      aria-label={IOSEI_LOGO_ALT}
    >
      <img src={ioseiLogoUrl} alt="" width={240} />
    </StyledIoseiAuthLogoButton>
  );
};
