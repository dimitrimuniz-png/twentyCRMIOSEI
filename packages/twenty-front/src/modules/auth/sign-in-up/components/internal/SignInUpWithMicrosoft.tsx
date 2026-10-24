import { IoseiAuthSecondaryButton } from '@/auth/components/iosei-auth/IoseiAuthSecondaryButton';
import { useHasMultipleAuthMethods } from '@/auth/sign-in-up/hooks/useHasMultipleAuthMethods';
import { useSignInWithMicrosoft } from '@/auth/sign-in-up/hooks/useSignInWithMicrosoft';
import { lastAuthenticatedMethodState } from '@/auth/states/lastAuthenticatedMethodState';
import { AuthenticatedMethod } from '@/auth/types/AuthenticatedMethod';
import { type SocialSsoSignInUpActionType } from '@/auth/types/SocialSsoSignInUpActionType';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useLingui } from '@lingui/react/macro';
import { doNotTranslate } from 'twenty-shared/i18n';
import { IconMicrosoft } from 'twenty-ui/icon';
import { LastUsedPill } from './LastUsedPill';
import { StyledSsoButtonContainer } from './SignInUpSsoButtonStyles';

export const SignInUpWithMicrosoft = ({
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
  const { signInWithMicrosoft } = useSignInWithMicrosoft();
  const hasMultipleAuthMethods = useHasMultipleAuthMethods();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  const handleClick = () => {
    setLastAuthenticatedMethod(AuthenticatedMethod.MICROSOFT);
    signInWithMicrosoft({ action });
  };

  const isLastUsed = lastAuthenticatedMethod === AuthenticatedMethod.MICROSOFT;

  return (
    <StyledSsoButtonContainer>
      <IoseiAuthSecondaryButton onClick={handleClick}>
        <IconMicrosoft size={18} />
        {isPortuguese
          ? doNotTranslate('Entrar com a Microsoft')
          : t`Continue with Microsoft`}
      </IoseiAuthSecondaryButton>
      {isLastUsed && (isGlobalScope || hasMultipleAuthMethods) && (
        <LastUsedPill />
      )}
    </StyledSsoButtonContainer>
  );
};
