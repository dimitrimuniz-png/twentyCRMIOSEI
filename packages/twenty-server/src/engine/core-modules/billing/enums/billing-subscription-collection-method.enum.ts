import { registerEnumType } from '@nestjs/graphql';

export enum BillingSubscriptionCollectionMethod {
  CHARGE_AUTOMATICALLY = 'CHARGE_AUTOMATICALLY',
  SEND_INVOICE = 'SEND_INVOICE',
}

registerEnumType(BillingSubscriptionCollectionMethod, {
  name: 'BillingSubscriptionCollectionMethod',
});
