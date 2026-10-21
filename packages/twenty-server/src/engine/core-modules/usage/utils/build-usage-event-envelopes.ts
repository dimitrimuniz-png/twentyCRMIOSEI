/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

const removedbuildUsageEventEnvelopes: RemovedCommercial = new Proxy(
  function buildUsageEventEnvelopes(..._args: unknown[]) { return removedbuildUsageEventEnvelopes; },
  {
    get: () => removedbuildUsageEventEnvelopes,
    apply: () => removedbuildUsageEventEnvelopes,
  },
);
export const buildUsageEventEnvelopes = removedbuildUsageEventEnvelopes;
