import { StyledIoseiAuthOrDivider } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useLingui } from '@lingui/react/macro';
import { doNotTranslate } from 'twenty-shared/i18n';

export const IoseiAuthOrDivider = () => {
  const { t, i18n } = useLingui();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  return (
    <StyledIoseiAuthOrDivider>
      {isPortuguese ? doNotTranslate('ou') : t`or`}
    </StyledIoseiAuthOrDivider>
  );
};
