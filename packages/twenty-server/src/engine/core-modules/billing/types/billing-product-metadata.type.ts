import { Field, ObjectType } from '@nestjs/graphql';

import { BillingPlanKey } from 'src/engine/core-modules/billing/enums/billing-plan-key.enum';
import { BillingProductKey } from 'src/engine/core-modules/billing/enums/billing-product-key.enum';
import { BillingUsageType } from 'src/engine/core-modules/billing/enums/billing-usage-type.enum';

@ObjectType('BillingProductMetadata')
export class BillingProductMetadata {
  @Field(() => BillingProductKey)
  productKey: BillingProductKey;

  @Field(() => BillingPlanKey)
  planKey: BillingPlanKey;

  @Field(() => BillingUsageType)
  priceUsageBased: BillingUsageType;

  @Field(() => String, { nullable: true })
  isLegacy?: string | null;
}
