import { Injectable } from '@nestjs/common';

import { type BillingSubscriptionEntity } from 'src/engine/core-modules/billing/entities/billing-subscription.entity';
import { type BillingProductKey } from 'src/engine/core-modules/billing/enums/billing-product-key.enum';

@Injectable()
export class BillingSubscriptionItemService {
  async getResourceCreditSubscriptionItemDetails(
    _subscription: BillingSubscriptionEntity,
  ): Promise<{
    stripeSubscriptionItemId: string;
    productKey: BillingProductKey;
    creditAmount: number;
    freeTrialQuantity: number;
    unitPriceCents: number;
  } | null> {
    // Billing tables are not part of the TypeORM connection on this build.
    return null;
  }
}
