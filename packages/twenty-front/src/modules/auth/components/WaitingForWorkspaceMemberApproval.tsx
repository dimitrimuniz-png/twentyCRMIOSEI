import { IoseiAuthSecondaryButton } from '@/auth/components/iosei-auth/IoseiAuthSecondaryButton';
import { IoseiAuthShell } from '@/auth/components/iosei-auth/IoseiAuthShell';
import {
  StyledIoseiAuthWaitBadge,
  StyledIoseiAuthWaitCopy,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useAuth } from '@/auth/hooks/useAuth';
import { currentUserState } from '@/auth/states/currentUserState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { IconClock } from 'twenty-ui/icon';
import { Loader } from 'twenty-ui/primitives/feedback';

type WaitingForWorkspaceMemberApprovalProps = {
  isLoading?: boolean;
  onCheckAgain: () => void;
};

export const WaitingForWorkspaceMemberApproval = ({
  isLoading = false,
  onCheckAgain: _onCheckAgain,
}: WaitingForWorkspaceMemberApprovalProps) => {
  const { t, i18n } = useLingui();
  const { signOut } = useAuth();
  const currentUser = useAtomStateValue(currentUserState);
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');
  const title = isPortuguese ? 'Aguardando aprovação' : t`Waiting for approval`;
  const explanation = isPortuguese
    ? 'Sua conta foi criada, mas o acesso ao CRM precisa ser liberado por um administrador. Você receberá um e-mail assim que for aprovado.'
    : t`Your account was created, but access to the CRM still needs to be released by an administrator. You will receive an email once it is approved.`;
  const email = currentUser?.email;

  return (
    <IoseiAuthShell
      title={isLoading ? undefined : title}
      subtitle={isLoading || !isNonEmptyString(email) ? undefined : email}
      adornment={
        isLoading ? undefined : (
          <StyledIoseiAuthWaitBadge>
            <IconClock size={24} stroke={1.8} />
          </StyledIoseiAuthWaitBadge>
        )
      }
    >
      {isLoading ? (
        <Loader color="gray" />
      ) : (
        <>
          <StyledIoseiAuthWaitCopy>{explanation}</StyledIoseiAuthWaitCopy>
          <IoseiAuthSecondaryButton onClick={() => void signOut()}>
            {isPortuguese ? 'Sair' : t`Sign out`}
          </IoseiAuthSecondaryButton>
        </>
      )}
    </IoseiAuthShell>
  );
};
