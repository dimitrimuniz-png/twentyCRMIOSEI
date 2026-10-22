import { type BillingProductEntity } from 'src/engine/core-modules/billing/entities/billing-product.entity';

// A string index signature would match every object and strip those
// properties from flat metadata types.
export class BillingSubscriptionItemEntity {
  private readonly commercialModuleRemoved = true;

  quantity?: number;

  billingProduct?: BillingProductEntity;
}
