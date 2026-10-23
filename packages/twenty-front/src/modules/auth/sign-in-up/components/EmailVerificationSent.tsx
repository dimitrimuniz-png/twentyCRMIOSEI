import { IoseiAuthPrimaryButton } from '@/auth/components/iosei-auth/IoseiAuthPrimaryButton';
import { IoseiAuthSecondaryButton } from '@/auth/components/iosei-auth/IoseiAuthSecondaryButton';
import { IoseiAuthTextLink } from '@/auth/components/iosei-auth/IoseiAuthTextLink';
import {
  StyledIoseiAuthCenteredLinkRow,
  StyledIoseiAuthCopy,
  StyledIoseiAuthIconCircle,
  StyledIoseiAuthSubtitle,
  StyledIoseiAuthTitle,
} from '@/auth/components/iosei-auth/iosei-auth-styles';
import { useHandleResendEmailVerificationToken } from '@/auth/sign-in-up/hooks/useHandleResendEmailVerificationToken';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { t } from '@lingui/core/macro';
import { IconGmail, IconMail, IconMailX, IconMicrosoft } from 'twenty-ui/icon';
import { openUrlInNewTab } from '~/utils/openUrlInNewTab';

export const EmailVerificationSent = ({
  email,
  isError = false,
}: {
  email: string | null;
  isError?: boolean;
}) => {
  const setSignInUpStep = useSetAtomState(signInUpStepState);

  const { handleResendEmailVerificationToken, loading: isLoading } =
    useHandleResendEmailVerificationToken();

  const handleOpenGmail = () => {
    const gmailUrl = email
      ? `https://mail.google.com/mail/u/${email}/`
      : 'https://mail.google.com/';
    openUrlInNewTab(gmailUrl);
  };

  const handleOpenOutlook = () => {
    const outlookUrl = email
      ? `https://outlook.live.com/mail/${email}/`
      : 'https://outlook.live.com/';
    openUrlInNewTab(outlookUrl);
  };

  const handleChangeEmail = () => {
    setSignInUpStep(SignInUpStep.Email);
  };

  const title = isError ? t`Email Verification Failed` : t`Check your Emails`;
  const subtitle = isError
    ? t`We encountered an issue verifying`
    : t`A verification email has been sent to`;

  const Icon = isError ? IconMailX : IconMail;

  return (
    <>
      <StyledIoseiAuthIconCircle>
        <Icon size={28} stroke={1.8} />
      </StyledIoseiAuthIconCircle>
      <StyledIoseiAuthCopy>
        <StyledIoseiAuthTitle>{title}</StyledIoseiAuthTitle>
        <StyledIoseiAuthSubtitle>
          {subtitle} {email}
        </StyledIoseiAuthSubtitle>
      </StyledIoseiAuthCopy>
      {isError ? (
        <>
          <IoseiAuthPrimaryButton
            onClick={handleResendEmailVerificationToken(email)}
            disabled={isLoading}
            loading={isLoading}
          >
            {t`Resend email`}
          </IoseiAuthPrimaryButton>
          <IoseiAuthSecondaryButton onClick={handleChangeEmail}>
            {t`Try with another email`}
          </IoseiAuthSecondaryButton>
        </>
      ) : (
        <>
          <IoseiAuthSecondaryButton onClick={handleOpenGmail}>
            <IconGmail size={18} />
            {t`Open Gmail`}
          </IoseiAuthSecondaryButton>
          <IoseiAuthSecondaryButton onClick={handleOpenOutlook}>
            <IconMicrosoft size={18} />
            {t`Open Outlook`}
          </IoseiAuthSecondaryButton>
          <StyledIoseiAuthCenteredLinkRow>
            <IoseiAuthTextLink
              onClick={handleResendEmailVerificationToken(email)}
              disabled={isLoading}
            >
              {isLoading ? t`Sending...` : t`Resend email`}
            </IoseiAuthTextLink>
            <IoseiAuthTextLink onClick={handleChangeEmail}>
              {t`Change email`}
            </IoseiAuthTextLink>
          </StyledIoseiAuthCenteredLinkRow>
        </>
      )}
    </>
  );
};
