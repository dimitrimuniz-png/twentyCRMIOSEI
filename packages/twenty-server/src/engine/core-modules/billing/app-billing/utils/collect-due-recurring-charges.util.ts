/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

const removedcollectDueRecurringCharges: RemovedCommercial = new Proxy(
  function collectDueRecurringCharges(..._args: unknown[]) { return removedcollectDueRecurringCharges; },
  {
    get: () => removedcollectDueRecurringCharges,
    apply: () => removedcollectDueRecurringCharges,
  },
);
export const collectDueRecurringCharges = removedcollectDueRecurringCharges;
