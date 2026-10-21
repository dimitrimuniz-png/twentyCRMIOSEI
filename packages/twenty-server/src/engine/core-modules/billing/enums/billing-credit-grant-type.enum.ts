/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

export enum BillingCreditGrantType {
  COMPENSATION = 'COMPENSATION',
  ONBOARDING_REWARD = 'ONBOARDING_REWARD',
  PURCHASE = 'PURCHASE',
  ROLLOVER = 'ROLLOVER',
  SALES = 'SALES',
}

export class ADMIN_GRANTABLE_CREDIT_GRANT_TYPES {
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
