import {
  BillingException,
  BillingExceptionCode,
} from 'src/engine/core-modules/billing/billing.exception';
import {
  UsageLimitException,
  UsageLimitExceptionCode,
} from 'src/engine/core-modules/usage-limit/exceptions/usage-limit.exception';

export const isUsageRefusedError = (
  error: unknown,
): error is BillingException | UsageLimitException => {
  if (
    error instanceof BillingException &&
    error.code === BillingExceptionCode.BILLING_SUBSCRIPTION_INACTIVE
  ) {
    return true;
  }

  return (
    error instanceof UsageLimitException &&
    error.code === UsageLimitExceptionCode.QUOTA_EXHAUSTED
  );
};
