/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

const removedisUsageRefusedError: RemovedCommercial = new Proxy(
  function isUsageRefusedError(..._args: unknown[]) { return removedisUsageRefusedError; },
  {
    get: () => removedisUsageRefusedError,
    apply: () => removedisUsageRefusedError,
  },
);
export const isUsageRefusedError = removedisUsageRefusedError;
