import { Field, Float, ObjectType } from '@nestjs/graphql';

import { BillingUsageType } from 'src/engine/core-modules/billing/enums/billing-usage-type.enum';
import { SubscriptionInterval } from 'src/engine/core-modules/billing/enums/billing-subscription-interval.enum';

@ObjectType('BillingPriceLicensed')
export class BillingPriceLicensedDTO {
  @Field(() => String)
  stripePriceId: string;

  @Field(() => Float)
  unitAmount: number;

  @Field(() => SubscriptionInterval)
  recurringInterval: SubscriptionInterval;

  @Field(() => BillingUsageType)
  priceUsageType: BillingUsageType;

  @Field(() => Float, { nullable: true })
  creditAmount?: number | null;

  @Field(() => Boolean)
  isSellable: boolean;
}
