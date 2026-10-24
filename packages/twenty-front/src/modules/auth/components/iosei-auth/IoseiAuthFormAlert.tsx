import { StyledIoseiAuthAlert } from '@/auth/components/iosei-auth/iosei-auth-styles';
import { authFormAlertState } from '@/auth/states/authFormAlertState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isNonEmptyString } from '@sniptt/guards';

const IOSEI_AUTH_FORM_ALERT_ID = 'iosei-auth-form-alert';

export const IoseiAuthFormAlert = () => {
  const authFormAlert = useAtomStateValue(authFormAlertState);

  if (!isNonEmptyString(authFormAlert)) {
    return null;
  }

  return (
    <StyledIoseiAuthAlert
      id={IOSEI_AUTH_FORM_ALERT_ID}
      role="alert"
      aria-live="polite"
    >
      {authFormAlert}
    </StyledIoseiAuthAlert>
  );
};
