import { type BillingProductEntity } from 'src/engine/core-modules/billing/entities/billing-product.entity';

// A string index signature would match every object and strip those
// properties from flat metadata types.
export class BillingPriceEntity {
  private readonly commercialModuleRemoved = true;

  tiers?: Array<{ up_to: number | null }>;

  billingProduct?: BillingProductEntity;

  metadata?: {
    credit_amount?: string | number | null;
  };
}
