/* eslint-disable @typescript-eslint/no-explicit-any */
// Self-hosted fork: commercial module removed. This stub keeps AGPL imports compiling.
type RemovedCommercial = any;

const removedisSendInvoiceSubscription: RemovedCommercial = new Proxy(
  function isSendInvoiceSubscription(..._args: unknown[]) { return removedisSendInvoiceSubscription; },
  {
    get: () => removedisSendInvoiceSubscription,
    apply: () => removedisSendInvoiceSubscription,
  },
);
export const isSendInvoiceSubscription = removedisSendInvoiceSubscription;
