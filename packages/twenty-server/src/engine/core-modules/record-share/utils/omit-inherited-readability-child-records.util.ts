/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

const removedomitInheritedReadabilityChildRecords: RemovedCommercial = new Proxy(
  function omitInheritedReadabilityChildRecords(..._args: unknown[]) { return removedomitInheritedReadabilityChildRecords; },
  {
    get: () => removedomitInheritedReadabilityChildRecords,
    apply: () => removedomitInheritedReadabilityChildRecords,
  },
);
export const omitInheritedReadabilityChildRecords = removedomitInheritedReadabilityChildRecords;
