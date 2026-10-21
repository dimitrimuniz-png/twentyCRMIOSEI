/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

const removedgetApiType: RemovedCommercial = new Proxy(
  function getApiType(..._args: unknown[]) { return removedgetApiType; },
  {
    get: () => removedgetApiType,
    apply: () => removedgetApiType,
  },
);
export const getApiType = removedgetApiType;
