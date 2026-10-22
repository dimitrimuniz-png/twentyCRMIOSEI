type InvoicePayingSubscription = {
  collection_method: string | null;
  pending_invoice_item_interval: unknown;
  status: string;
};

export const shouldSetPendingInvoiceItemInterval = (
  subscription: InvoicePayingSubscription,
): boolean =>
  subscription.collection_method === 'send_invoice' &&
  subscription.pending_invoice_item_interval === null &&
  (subscription.status === 'active' || subscription.status === 'trialing');
