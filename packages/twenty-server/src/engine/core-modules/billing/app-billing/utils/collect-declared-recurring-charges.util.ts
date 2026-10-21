/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

export type DeclaredRecurringCharge = RemovedCommercial;
const removedcollectDeclaredRecurringCharges: RemovedCommercial = new Proxy(
  function collectDeclaredRecurringCharges(..._args: unknown[]) { return removedcollectDeclaredRecurringCharges; },
  {
    get: () => removedcollectDeclaredRecurringCharges,
    apply: () => removedcollectDeclaredRecurringCharges,
  },
);
export const collectDeclaredRecurringCharges = removedcollectDeclaredRecurringCharges;
