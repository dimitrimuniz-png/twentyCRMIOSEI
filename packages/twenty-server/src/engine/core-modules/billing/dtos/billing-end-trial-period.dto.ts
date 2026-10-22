import { Field, ObjectType } from '@nestjs/graphql';

import { BillingSubscriptionEntity } from 'src/engine/core-modules/billing/entities/billing-subscription.entity';
import { SubscriptionStatus } from 'src/engine/core-modules/billing/enums/billing-subscription-status.enum';

@ObjectType('BillingEndTrialPeriod')
export class BillingEndTrialPeriodDTO {
  @Field(() => SubscriptionStatus, {
    nullable: true,
    description: 'Updated subscription status',
  })
  status?: SubscriptionStatus | null;

  @Field(() => Boolean, {
    description: 'Boolean that confirms if a payment method was found',
  })
  hasPaymentMethod: boolean;

  @Field(() => String, {
    nullable: true,
    description:
      'Billing portal URL for payment method update (returned when no payment method exists)',
  })
  billingPortalUrl?: string | null;

  @Field(() => BillingSubscriptionEntity, {
    nullable: true,
    description: 'Updated current billing subscription',
  })
  currentBillingSubscription?: BillingSubscriptionEntity | null;

  @Field(() => [BillingSubscriptionEntity], {
    nullable: true,
    description: 'All billing subscriptions',
  })
  billingSubscriptions?: BillingSubscriptionEntity[] | null;
}
