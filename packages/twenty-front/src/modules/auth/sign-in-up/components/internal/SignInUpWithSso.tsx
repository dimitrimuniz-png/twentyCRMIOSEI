import { IoseiAuthSecondaryButton } from '@/auth/components/iosei-auth/IoseiAuthSecondaryButton';
import { IoseiAuthTextLink } from '@/auth/components/iosei-auth/IoseiAuthTextLink';
import { type SsoIdentityProviderLike } from '@/auth/components/iosei-auth/is-google-oidc-identity-provider.util';
import { StyledIoseiAuthCenteredLinkRow } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useHasMultipleAuthMethods } from '@/auth/sign-in-up/hooks/useHasMultipleAuthMethods';
import { useSso } from '@/auth/sign-in-up/hooks/useSso';
import { lastAuthenticatedMethodState } from '@/auth/states/lastAuthenticatedMethodState';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';
import { AuthenticatedMethod } from '@/auth/types/AuthenticatedMethod';
import { workspaceAuthProvidersState } from '@/workspace/states/workspaceAuthProvidersState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useLingui } from '@lingui/react/macro';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDefined } from 'twenty-shared/utils';
import { IconLock } from 'twenty-ui/icon';
import { LastUsedPill } from './LastUsedPill';
import { StyledSsoButtonContainer } from './SignInUpSsoButtonStyles';

export const SignInUpWithSso = ({
  identityProviders,
  appearance = 'link',
}: {
  identityProviders?: SsoIdentityProviderLike[];
  appearance?: 'link' | 'button';
}) => {
  const { t, i18n } = useLingui();
  const setSignInUpStep = useSetAtomState(signInUpStepState);
  const workspaceAuthProviders = useAtomStateValue(workspaceAuthProvidersState);
  const [lastAuthenticatedMethod, setLastAuthenticatedMethod] = useAtomState(
    lastAuthenticatedMethodState,
  );
  const hasMultipleAuthMethods = useHasMultipleAuthMethods();
  const { redirectToSsoLoginPage } = useSso();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');
  const providers = identityProviders ?? workspaceAuthProviders?.sso ?? [];
  const label = isPortuguese
    ? doNotTranslate('Entrar com SSO')
    : t`Single sign-on (SSO)`;

  const signInWithSso = () => {
    setLastAuthenticatedMethod(AuthenticatedMethod.SSO);

    if (providers.length === 1 && isDefined(providers[0])) {
      return redirectToSsoLoginPage(providers[0].id);
    }

    setSignInUpStep(SignInUpStep.SsoIdentityProviderSelection);
  };

  const isLastUsed = lastAuthenticatedMethod === AuthenticatedMethod.SSO;

  if (appearance === 'link') {
    return (
      <StyledIoseiAuthCenteredLinkRow>
        <IoseiAuthTextLink onClick={signInWithSso}>{label}</IoseiAuthTextLink>
      </StyledIoseiAuthCenteredLinkRow>
    );
  }

  return (
    <StyledSsoButtonContainer>
      <IoseiAuthSecondaryButton onClick={signInWithSso}>
        <IconLock size={18} />
        {label}
      </IoseiAuthSecondaryButton>
      {isLastUsed && hasMultipleAuthMethods && <LastUsedPill />}
    </StyledSsoButtonContainer>
  );
};
