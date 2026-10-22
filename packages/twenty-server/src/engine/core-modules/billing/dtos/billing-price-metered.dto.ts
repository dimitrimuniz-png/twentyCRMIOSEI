import { Field, Float, ObjectType } from '@nestjs/graphql';

import { BillingUsageType } from 'src/engine/core-modules/billing/enums/billing-usage-type.enum';
import { SubscriptionInterval } from 'src/engine/core-modules/billing/enums/billing-subscription-interval.enum';

@ObjectType('BillingPriceTier')
export class BillingPriceTierDTO {
  @Field(() => Float, { nullable: true })
  flatAmount?: number | null;

  @Field(() => Float, { nullable: true })
  unitAmount?: number | null;

  @Field(() => Float, { nullable: true })
  upTo?: number | null;
}

@ObjectType('BillingPriceMetered')
export class BillingPriceMeteredDTO {
  @Field(() => BillingUsageType)
  priceUsageType: BillingUsageType;

  @Field(() => SubscriptionInterval)
  recurringInterval: SubscriptionInterval;

  @Field(() => String)
  stripePriceId: string;

  @Field(() => [BillingPriceTierDTO])
  tiers: BillingPriceTierDTO[];
}
