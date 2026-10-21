import { BillingSubscriptionCollectionMethod } from 'src/engine/core-modules/billing/enums/billing-subscription-collection-method.enum';

export const isSendInvoiceSubscription = ({
  collectionMethod,
}: {
  collectionMethod: BillingSubscriptionCollectionMethod;
}): boolean =>
  collectionMethod === BillingSubscriptionCollectionMethod.SEND_INVOICE;
