/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

const removedevaluateRowAccessPolicy: RemovedCommercial = new Proxy(
  function evaluateRowAccessPolicy(..._args: unknown[]) { return removedevaluateRowAccessPolicy; },
  {
    get: () => removedevaluateRowAccessPolicy,
    apply: () => removedevaluateRowAccessPolicy,
  },
);
export const evaluateRowAccessPolicy = removedevaluateRowAccessPolicy;

export type RowAccessEvaluationContext = RemovedCommercial;
export type RowAccessRecord = RemovedCommercial;