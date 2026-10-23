import { IoseiLogo } from '@/auth/components/iosei-auth/IoseiLogo';
import {
  StyledIoseiAuthBody,
  StyledIoseiAuthCard,
  StyledIoseiAuthCopy,
  StyledIoseiAuthDivider,
  StyledIoseiAuthFooter,
  StyledIoseiAuthPage,
  StyledIoseiAuthSubtitle,
  StyledIoseiAuthTitle,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { type ReactNode } from 'react';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isNonEmptyString } from '@sniptt/guards';
import { ThemeProvider } from 'twenty-ui/theme';

type IoseiAuthShellProps = {
  title?: string;
  subtitle?: string;
  adornment?: ReactNode;
  onLogoClick?: () => void;
  children: ReactNode;
};

export const IoseiAuthShell = ({
  title,
  subtitle,
  adornment,
  onLogoClick,
  children,
}: IoseiAuthShellProps) => {
  return (
    <ThemeProvider colorScheme="light" applyToRoot={false}>
      <StyledIoseiAuthPage>
        <StyledIoseiAuthCard>
          <IoseiLogo onClick={onLogoClick} />
          <StyledIoseiAuthDivider />
          {adornment}
          {(isNonEmptyString(title) || isNonEmptyString(subtitle)) && (
            <StyledIoseiAuthCopy>
              {isNonEmptyString(title) && (
                <StyledIoseiAuthTitle>{title}</StyledIoseiAuthTitle>
              )}
              {isNonEmptyString(subtitle) && (
                <StyledIoseiAuthSubtitle>{subtitle}</StyledIoseiAuthSubtitle>
              )}
            </StyledIoseiAuthCopy>
          )}
          <StyledIoseiAuthBody>{children}</StyledIoseiAuthBody>
        </StyledIoseiAuthCard>
        <StyledIoseiAuthFooter>
          {doNotTranslate('© IOSEI Global Operations')}
        </StyledIoseiAuthFooter>
      </StyledIoseiAuthPage>
    </ThemeProvider>
  );
};
