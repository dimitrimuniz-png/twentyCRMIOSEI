/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

export class BillingException {
  constructor(..._args: unknown[]) {
    return new Proxy(this, {
      get(target, property, receiver) {
        if (property === 'then') return undefined;
        const own = Reflect.get(target, property, receiver);
        if (own !== undefined) return own;
        return (..._ignored: unknown[]) => undefined;
      },
    });
  }
  [key: string]: RemovedCommercial;
}

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
