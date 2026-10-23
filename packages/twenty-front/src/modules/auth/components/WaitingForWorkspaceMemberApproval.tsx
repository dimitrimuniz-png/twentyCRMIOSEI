/* oxlint-disable twenty/no-hardcoded-colors -- IOSEI brand screen, shown before the workspace theme is available. */
import { useAuth } from '@/auth/hooks/useAuth';
import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { useEffect } from 'react';
import { IconClock } from 'twenty-ui/icon';
import { Loader } from 'twenty-ui/primitives/feedback';
import ioseiLogo from '@/auth/components/assets/iosei-logo.png';

const IOSEI_APPROVAL_FONTS_ID = 'iosei-approval-fonts';

const StyledPage = styled.div`
  align-items: center;
  background-color: #eef1fa;
  background-image: radial-gradient(
    rgba(11, 16, 80, 0.06) 2px,
    transparent 2px
  );
  background-size: 32px 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100dvh;
  padding: 64px 24px;
  width: 100%;
`;

const StyledCard = styled.div`
  align-items: center;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(11, 16, 80, 0.1);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 440px;
  padding: 44px 40px 40px;
  width: 100%;
`;

const StyledLogo = styled.img`
  display: block;
  height: auto;
  margin-bottom: 8px;
  width: 240px;
`;

const StyledDivider = styled.div`
  background: #e1e4ec;
  height: 1px;
  width: 100%;
`;

const StyledIconCircle = styled.div`
  align-items: center;
  background: rgba(11, 16, 80, 0.08);
  border-radius: 999px;
  color: #0b1050;
  display: flex;
  height: 64px;
  justify-content: center;
  width: 64px;
`;

const StyledCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
`;

const StyledTitle = styled.h1`
  color: #0b1050;
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: #5a6078;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  margin: 0;
`;

const StyledButton = styled.button`
  background: #0b1050;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  cursor: pointer;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  height: 52px;
  width: 100%;

  &:hover {
    background: #1f2a7a;
  }
`;

const StyledCheckAgain = styled.button`
  background: transparent;
  border: 0;
  color: #2b3f9e;
  cursor: pointer;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    color: #0b1050;
  }
`;

const StyledFooter = styled.p`
  color: #8e94b8;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  margin: 28px 0 0;
`;

type WaitingForWorkspaceMemberApprovalProps = {
  isLoading?: boolean;
  onCheckAgain: () => void;
};

export const WaitingForWorkspaceMemberApproval = ({
  isLoading = false,
  onCheckAgain,
}: WaitingForWorkspaceMemberApprovalProps) => {
  const { i18n } = useLingui();
  const { signOut } = useAuth();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  useEffect(() => {
    if (document.getElementById(IOSEI_APPROVAL_FONTS_ID)) {
      return;
    }

    const link = document.createElement('link');

    link.id = IOSEI_APPROVAL_FONTS_ID;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Outfit:wght@600&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <StyledPage>
      <StyledCard>
        <StyledLogo src={ioseiLogo} alt="IOSEI Global Operations" />
        <StyledDivider />
        {isLoading ? (
          <Loader color="gray" />
        ) : (
          <>
            <StyledIconCircle>
              <IconClock size={28} stroke={1.8} />
            </StyledIconCircle>
            <StyledCopy>
              <StyledTitle>
                {isPortuguese ? 'Aguardando aprovação' : 'Waiting for approval'}
              </StyledTitle>
              <StyledSubtitle>
                {isPortuguese
                  ? 'Seu acesso ao CRM da IOSEI está em análise. Você será notificado quando um administrador aprovar sua conta.'
                  : 'Your access to the IOSEI CRM is under review. You will be notified when an administrator approves your account.'}
              </StyledSubtitle>
            </StyledCopy>
            <StyledButton type="button" onClick={() => void signOut()}>
              {isPortuguese ? 'Sair' : 'Sign out'}
            </StyledButton>
            <StyledCheckAgain type="button" onClick={onCheckAgain}>
              {isPortuguese ? 'Verificar novamente' : 'Check again'}
            </StyledCheckAgain>
          </>
        )}
      </StyledCard>
      <StyledFooter>© IOSEI Global Operations</StyledFooter>
    </StyledPage>
  );
};
