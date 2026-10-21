import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { CustomException } from 'src/utils/custom-exception';

export enum BillingExceptionCode {
  BILLING_CREDIT_AMOUNT_INVALID = 'BILLING_CREDIT_AMOUNT_INVALID',
  BILLING_CREDIT_GRANT_TYPE_NOT_GRANTABLE = 'BILLING_CREDIT_GRANT_TYPE_NOT_GRANTABLE',
  BILLING_CUSTOMER_NOT_FOUND = 'BILLING_CUSTOMER_NOT_FOUND',
  BILLING_PRICE_INVALID = 'BILLING_PRICE_INVALID',
  BILLING_PRICE_INVALID_TIERS = 'BILLING_PRICE_INVALID_TIERS',
  BILLING_PRICE_NOT_FOUND = 'BILLING_PRICE_NOT_FOUND',
  BILLING_STRIPE_ERROR = 'BILLING_STRIPE_ERROR',
  BILLING_SUBSCRIPTION_INACTIVE = 'BILLING_SUBSCRIPTION_INACTIVE',
  BILLING_SUBSCRIPTION_NOT_FOUND = 'BILLING_SUBSCRIPTION_NOT_FOUND',
}

export class BillingException extends CustomException<BillingExceptionCode> {
  constructor(
    message: string,
    code: BillingExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ?? msg`Billing is not available on this build.`,
    });
  }
}
