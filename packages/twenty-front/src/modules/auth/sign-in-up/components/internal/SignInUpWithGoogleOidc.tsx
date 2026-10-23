import { IoseiAuthSecondaryButton } from '@/auth/components/iosei-auth/IoseiAuthSecondaryButton';
import { useSso } from '@/auth/sign-in-up/hooks/useSso';
import { lastAuthenticatedMethodState } from '@/auth/states/lastAuthenticatedMethodState';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';
import { AuthenticatedMethod } from '@/auth/types/AuthenticatedMethod';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconGoogle } from 'twenty-ui/icon';
import { StyledSsoButtonContainer } from './SignInUpSsoButtonStyles';

type SignInUpWithGoogleOidcProps = {
  identityProviderId: string | null;
};

export const SignInUpWithGoogleOidc = ({
  identityProviderId,
}: SignInUpWithGoogleOidcProps) => {
  const { t, i18n } = useLingui();
  const setSignInUpStep = useSetAtomState(signInUpStepState);
  const setLastAuthenticatedMethod = useSetAtomState(
    lastAuthenticatedMethodState,
  );
  const { redirectToSsoLoginPage } = useSso();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  const handleClick = () => {
    setLastAuthenticatedMethod(AuthenticatedMethod.SSO);

    if (isDefined(identityProviderId)) {
      void redirectToSsoLoginPage(identityProviderId);
      return;
    }

    setSignInUpStep(SignInUpStep.SsoIdentityProviderSelection);
  };

  return (
    <StyledSsoButtonContainer>
      <IoseiAuthSecondaryButton onClick={handleClick}>
        <IconGoogle size={18} />
        {isPortuguese ? 'Entrar com Google' : t`Continue with Google`}
      </IoseiAuthSecondaryButton>
    </StyledSsoButtonContainer>
  );
};
