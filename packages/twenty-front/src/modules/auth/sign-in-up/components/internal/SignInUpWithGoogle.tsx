import { IoseiAuthSecondaryButton } from '@/auth/components/iosei-auth/IoseiAuthSecondaryButton';
import { useHasMultipleAuthMethods } from '@/auth/sign-in-up/hooks/useHasMultipleAuthMethods';
import { useSignInWithGoogle } from '@/auth/sign-in-up/hooks/useSignInWithGoogle';
import { lastAuthenticatedMethodState } from '@/auth/states/lastAuthenticatedMethodState';
import { AuthenticatedMethod } from '@/auth/types/AuthenticatedMethod';
import { type SocialSsoSignInUpActionType } from '@/auth/types/SocialSsoSignInUpActionType';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useLingui } from '@lingui/react/macro';
import { IconGoogle } from 'twenty-ui/icon';
import { LastUsedPill } from './LastUsedPill';
import { StyledSsoButtonContainer } from './SignInUpSsoButtonStyles';

export const SignInUpWithGoogle = ({
  action,
  isGlobalScope,
}: {
  action: SocialSsoSignInUpActionType;
  isGlobalScope?: boolean;
}) => {
  const { t, i18n } = useLingui();
  const [lastAuthenticatedMethod, setLastAuthenticatedMethod] = useAtomState(
    lastAuthenticatedMethodState,
  );
  const { signInWithGoogle } = useSignInWithGoogle();
  const hasMultipleAuthMethods = useHasMultipleAuthMethods();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  const handleClick = () => {
    setLastAuthenticatedMethod(AuthenticatedMethod.GOOGLE);
    signInWithGoogle({ action });
  };

  const isLastUsed = lastAuthenticatedMethod === AuthenticatedMethod.GOOGLE;

  return (
    <StyledSsoButtonContainer>
      <IoseiAuthSecondaryButton onClick={handleClick}>
        <IconGoogle size={18} />
        {isPortuguese ? 'Entrar com Google' : t`Continue with Google`}
      </IoseiAuthSecondaryButton>
      {isLastUsed && (isGlobalScope || hasMultipleAuthMethods) && (
        <LastUsedPill />
      )}
    </StyledSsoButtonContainer>
  );
};
