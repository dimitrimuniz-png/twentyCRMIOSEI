import { IoseiAuthFormAlert } from '@/auth/components/iosei-auth/IoseiAuthFormAlert';
import { IoseiAuthOrDivider } from '@/auth/components/iosei-auth/IoseiAuthOrDivider';
import { IoseiAuthTextLink } from '@/auth/components/iosei-auth/IoseiAuthTextLink';
import { partitionSsoIdentityProviders } from '@/auth/components/iosei-auth/is-google-oidc-identity-provider.util';
import { StyledIoseiAuthMethods } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { SignInUpWithCredentials } from '@/auth/sign-in-up/components/internal/SignInUpWithCredentials';
import { SignInUpWithGoogle } from '@/auth/sign-in-up/components/internal/SignInUpWithGoogle';
import { SignInUpWithGoogleOidc } from '@/auth/sign-in-up/components/internal/SignInUpWithGoogleOidc';
import { SignInUpWithMicrosoft } from '@/auth/sign-in-up/components/internal/SignInUpWithMicrosoft';
import { SignInUpWithSso } from '@/auth/sign-in-up/components/internal/SignInUpWithSso';
import { useHandleResetPassword } from '@/auth/sign-in-up/hooks/useHandleResetPassword';
import { useSignInUpForm } from '@/auth/sign-in-up/hooks/useSignInUpForm';
import { useWorkspaceBypass } from '@/auth/sign-in-up/hooks/useWorkspaceBypass';
import { workspaceAuthBypassProvidersState } from '@/workspace/states/workspaceAuthBypassProvidersState';
import { workspaceAuthProvidersState } from '@/workspace/states/workspaceAuthProvidersState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { Trans, useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';
import { doNotTranslate } from 'twenty-shared/i18n';

export const SignInUpWorkspaceScopeForm = () => {
  const { i18n } = useLingui();
  const workspaceAuthProviders = useAtomStateValue(workspaceAuthProvidersState);
  const workspaceAuthBypassProviders = useAtomStateValue(
    workspaceAuthBypassProvidersState,
  );
  const { shouldOfferBypass, shouldUseBypass } = useWorkspaceBypass();
  const { form } = useSignInUpForm();
  const { handleResetPassword } = useHandleResetPassword();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');

  if (!workspaceAuthProviders) {
    return <IoseiAuthFormAlert />;
  }

  const providers =
    shouldOfferBypass && shouldUseBypass
      ? {
          ...workspaceAuthBypassProviders,
          sso: [],
        }
      : workspaceAuthProviders;

  const { googleOidcIdentityProviders, otherIdentityProviders } =
    partitionSsoIdentityProviders(providers.sso);
  const showGoogleOidc = googleOidcIdentityProviders.length > 0;
  const showBuiltInGoogle = providers.google && !showGoogleOidc;
  const showGoogle = showBuiltInGoogle || showGoogleOidc;
  const showOtherSso = otherIdentityProviders.length > 0;
  const forgotPasswordLink = (
    <IoseiAuthTextLink onClick={handleResetPassword(form.getValues('email'))}>
      {isPortuguese ? (
        doNotTranslate('Esqueceu a senha?')
      ) : (
        <Trans>Forgot your password?</Trans>
      )}
    </IoseiAuthTextLink>
  );

  return (
    <StyledIoseiAuthMethods>
      {showBuiltInGoogle && <SignInUpWithGoogle action="join-workspace" />}
      {showGoogleOidc && (
        <SignInUpWithGoogleOidc
          identityProviderId={
            googleOidcIdentityProviders.length === 1
              ? googleOidcIdentityProviders[0].id
              : null
          }
        />
      )}
      {showGoogle && providers.password && <IoseiAuthOrDivider />}
      {providers.password && (
        // oxlint-disable-next-line react/jsx-props-no-spreading
        <FormProvider {...form}>
          <SignInUpWithCredentials beforeSubmit={forgotPasswordLink} />
        </FormProvider>
      )}
      {!providers.password && <IoseiAuthFormAlert />}
      {!showGoogle && !providers.password && providers.microsoft && (
        <SignInUpWithMicrosoft action="join-workspace" />
      )}
      {!showGoogle && !providers.password && showOtherSso && (
        <SignInUpWithSso
          identityProviders={otherIdentityProviders}
          appearance="button"
        />
      )}
    </StyledIoseiAuthMethods>
  );
};
