import { StyledIoseiAuthOrDivider } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useLingui } from '@lingui/react/macro';

export const IoseiAuthOrDivider = () => {
  const { t, i18n } = useLingui();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  return (
    <StyledIoseiAuthOrDivider>
      {isPortuguese ? 'ou' : t`or`}
    </StyledIoseiAuthOrDivider>
  );
};
