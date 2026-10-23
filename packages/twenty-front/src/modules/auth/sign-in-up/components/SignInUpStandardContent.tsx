import { IoseiAuthShell } from '@/auth/components/iosei-auth/IoseiAuthShell';
import { FooterNote } from '@/auth/sign-in-up/components/FooterNote';
import { WorkspaceSelectionFooter } from '@/auth/sign-in-up/components/WorkspaceSelectionFooter';
import { useWorkspaceFromInviteHash } from '@/auth/sign-in-up/hooks/useWorkspaceFromInviteHash';
import { SignInUpStep } from '@/auth/states/signInUpStepState';
import { useLingui } from '@lingui/react/macro';
import { type JSX } from 'react';
import { isDefined } from 'twenty-shared/utils';

type SignInUpStandardContentProps = {
  signInUpForm: JSX.Element | null;
  signInUpStep: SignInUpStep;
  title: string;
  onClickOnLogo: () => void;
};

const CREDENTIAL_STEPS = [
  SignInUpStep.Init,
  SignInUpStep.Email,
  SignInUpStep.Password,
];

export const SignInUpStandardContent = ({
  signInUpForm,
  signInUpStep,
  title,
  onClickOnLogo,
}: SignInUpStandardContentProps) => {
  const { t, i18n } = useLingui();
  const { workspaceInviteHash } = useWorkspaceFromInviteHash();
  const isPortuguese = i18n.locale.toLowerCase().startsWith('pt');
  const isCredentialStep = CREDENTIAL_STEPS.includes(signInUpStep);
  const isInvite = isDefined(workspaceInviteHash);
  const heading =
    isCredentialStep && !isInvite
      ? isPortuguese
        ? 'Acesse sua conta'
        : t`Sign in to your account`
      : title;
  const subtitle =
    isCredentialStep && !isInvite
      ? isPortuguese
        ? 'Use o e-mail corporativo da IOSEI'
        : t`Use your IOSEI work email`
      : undefined;

  return (
    <IoseiAuthShell
      title={heading}
      subtitle={subtitle}
      onLogoClick={onClickOnLogo}
    >
      {signInUpForm}
      {signInUpStep === SignInUpStep.WorkspaceSelection && (
        <WorkspaceSelectionFooter />
      )}
      {![
        SignInUpStep.Password,
        SignInUpStep.TwoFactorAuthenticationProvision,
        SignInUpStep.TwoFactorAuthenticationVerification,
        SignInUpStep.TwoFactorAuthenticationRecovery,
        SignInUpStep.WorkspaceSelection,
        SignInUpStep.WorkspaceCreation,
      ].includes(signInUpStep) && <FooterNote />}
    </IoseiAuthShell>
  );
};
