import { IoseiAuthFormAlert } from '@/auth/components/iosei-auth/IoseiAuthFormAlert';
import { IoseiAuthTextLink } from '@/auth/components/iosei-auth/IoseiAuthTextLink';
import { partitionSsoIdentityProviders } from '@/auth/components/iosei-auth/is-google-oidc-identity-provider.util';
import {
  StyledIoseiAuthForgotPasswordRow,
  StyledIoseiAuthMethods,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { SignInUpWithCredentials } from '@/auth/sign-in-up/components/internal/SignInUpWithCredentials';
import { SignInUpWithGoogle } from '@/auth/sign-in-up/components/internal/SignInUpWithGoogle';
import { SignInUpWithGoogleOidc } from '@/auth/sign-in-up/components/internal/SignInUpWithGoogleOidc';
import { SignInUpWithMicrosoft } from '@/auth/sign-in-up/components/internal/SignInUpWithMicrosoft';
import { SignInUpWithSso } from '@/auth/sign-in-up/components/internal/SignInUpWithSso';
import { useHandleResetPassword } from '@/auth/sign-in-up/hooks/useHandleResetPassword';
import { useSignInUp } from '@/auth/sign-in-up/hooks/useSignInUp';
import { useSignInUpForm } from '@/auth/sign-in-up/hooks/useSignInUpForm';
import { useWorkspaceBypass } from '@/auth/sign-in-up/hooks/useWorkspaceBypass';
import { SignInUpStep } from '@/auth/states/signInUpStepState';
import { workspaceAuthBypassProvidersState } from '@/workspace/states/workspaceAuthBypassProvidersState';
import { workspaceAuthProvidersState } from '@/workspace/states/workspaceAuthProvidersState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { Trans, useLingui } from '@lingui/react/macro';
import { FormProvider } from 'react-hook-form';

export const SignInUpWorkspaceScopeForm = () => {
  const { i18n } = useLingui();
  const workspaceAuthProviders = useAtomStateValue(workspaceAuthProvidersState);
  const workspaceAuthBypassProviders = useAtomStateValue(
    workspaceAuthBypassProvidersState,
  );
  const { shouldOfferBypass, shouldUseBypass } = useWorkspaceBypass();
  const { form } = useSignInUpForm();
  const { handleResetPassword } = useHandleResetPassword();
  const { signInUpStep } = useSignInUp(form);
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
  const showOtherSso = otherIdentityProviders.length > 0;
  const hasAnotherSignInMethod =
    providers.password ||
    showBuiltInGoogle ||
    showGoogleOidc ||
    providers.microsoft;
  const forgotPasswordLink =
    providers.password && signInUpStep === SignInUpStep.Password ? (
      <StyledIoseiAuthForgotPasswordRow>
        <IoseiAuthTextLink
          onClick={handleResetPassword(form.getValues('email'))}
        >
          {isPortuguese ? (
            'Esqueceu a senha?'
          ) : (
            <Trans>Forgot your password?</Trans>
          )}
        </IoseiAuthTextLink>
      </StyledIoseiAuthForgotPasswordRow>
    ) : null;

  return (
    <StyledIoseiAuthMethods>
      {providers.password && (
        // oxlint-disable-next-line react/jsx-props-no-spreading
        <FormProvider {...form}>
          <SignInUpWithCredentials beforeSubmit={forgotPasswordLink} />
        </FormProvider>
      )}
      {!providers.password && <IoseiAuthFormAlert />}
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
      {providers.microsoft && <SignInUpWithMicrosoft action="join-workspace" />}
      {showOtherSso && (
        <SignInUpWithSso
          identityProviders={otherIdentityProviders}
          appearance={hasAnotherSignInMethod ? 'link' : 'button'}
        />
      )}
    </StyledIoseiAuthMethods>
  );
};
