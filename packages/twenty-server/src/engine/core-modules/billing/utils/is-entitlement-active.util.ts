import { BillingEntitlementKey } from 'src/engine/core-modules/billing/enums/billing-entitlement-key.enum';

type IsEntitlementActiveArgs = {
  key: BillingEntitlementKey;
  hasValidEnterprisePlan: boolean;
  isBillingEnabled: boolean;
  stripeEntitlementValue: boolean;
};

// Self-host without billing keeps the keys the AGPL suite treats as included.
// A missing Organization license does not grant the remaining keys.
const ENTITLEMENTS_GRANTED_WITHOUT_BILLING = new Set<BillingEntitlementKey>([
  BillingEntitlementKey.CUSTOM_ROLES,
]);

export const isEntitlementActive = ({
  key,
  hasValidEnterprisePlan,
  isBillingEnabled,
  stripeEntitlementValue,
}: IsEntitlementActiveArgs): boolean => {
  if (!hasValidEnterprisePlan) {
    return ENTITLEMENTS_GRANTED_WITHOUT_BILLING.has(key) && !isBillingEnabled;
  }

  if (!isBillingEnabled) {
    return true;
  }

  return stripeEntitlementValue;
};
