import { IoseiAuthPrimaryButton } from '@/auth/components/iosei-auth/IoseiAuthPrimaryButton';
import { IoseiAuthShell } from '@/auth/components/iosei-auth/IoseiAuthShell';
import { IoseiAuthTextLink } from '@/auth/components/iosei-auth/IoseiAuthTextLink';
import {
  StyledIoseiAuthCenteredLinkRow,
  StyledIoseiAuthIconCircle,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useAuth } from '@/auth/hooks/useAuth';
import { useLingui } from '@lingui/react/macro';
import { IconClock } from 'twenty-ui/icon';
import { Loader } from 'twenty-ui/primitives/feedback';

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
  const title = isPortuguese ? 'Aguardando aprovação' : 'Waiting for approval';
  const subtitle = isPortuguese
    ? 'Seu acesso ao CRM da IOSEI está em análise. Você será notificado quando um administrador aprovar sua conta.'
    : 'Your access to the IOSEI CRM is under review. You will be notified when an administrator approves your account.';

  return (
    <IoseiAuthShell
      title={isLoading ? undefined : title}
      subtitle={isLoading ? undefined : subtitle}
      adornment={
        isLoading ? undefined : (
          <StyledIoseiAuthIconCircle>
            <IconClock size={28} stroke={1.8} />
          </StyledIoseiAuthIconCircle>
        )
      }
    >
      {isLoading ? (
        <Loader color="gray" />
      ) : (
        <>
          <IoseiAuthPrimaryButton onClick={() => void signOut()}>
            {isPortuguese ? 'Sair' : 'Sign out'}
          </IoseiAuthPrimaryButton>
          <StyledIoseiAuthCenteredLinkRow>
            <IoseiAuthTextLink onClick={onCheckAgain}>
              {isPortuguese ? 'Verificar novamente' : 'Check again'}
            </IoseiAuthTextLink>
          </StyledIoseiAuthCenteredLinkRow>
        </>
      )}
    </IoseiAuthShell>
  );
};
