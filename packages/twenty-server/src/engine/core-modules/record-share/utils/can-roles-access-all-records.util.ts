/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

const removedcanRolesAccessAllRecords: RemovedCommercial = new Proxy(
  function canRolesAccessAllRecords(..._args: unknown[]) { return removedcanRolesAccessAllRecords; },
  {
    get: () => removedcanRolesAccessAllRecords,
    apply: () => removedcanRolesAccessAllRecords,
  },
);
export const canRolesAccessAllRecords = removedcanRolesAccessAllRecords;
