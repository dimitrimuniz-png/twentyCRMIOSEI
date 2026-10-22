import { Field, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { BillingSubscriptionCollectionMethod } from 'src/engine/core-modules/billing/enums/billing-subscription-collection-method.enum';
import { SubscriptionInterval } from 'src/engine/core-modules/billing/enums/billing-subscription-interval.enum';
import { SubscriptionStatus } from 'src/engine/core-modules/billing/enums/billing-subscription-status.enum';
import { BillingSubscriptionItemDTO } from 'src/engine/core-modules/billing/dtos/billing-subscription-item.dto';
import { BillingSubscriptionSchedulePhaseDTO } from 'src/engine/core-modules/billing/dtos/billing-subscription-schedule-phase.dto';

// Billing stays inactive. The type only exists so the metadata schema matches
// the documents the front already sends.
@ObjectType('BillingSubscription')
export class BillingSubscriptionEntity {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => SubscriptionStatus)
  status: SubscriptionStatus;

  @Field(() => SubscriptionInterval, { nullable: true })
  interval?: SubscriptionInterval | null;

  @Field(() => GraphQLJSON)
  metadata: Record<string, unknown>;

  @Field(() => Date, { nullable: true })
  currentPeriodEnd?: Date | null;

  @Field(() => Date, { nullable: true })
  cancelAt?: Date | null;

  @Field(() => BillingSubscriptionCollectionMethod, { nullable: true })
  collectionMethod?: BillingSubscriptionCollectionMethod | null;

  @Field(() => [BillingSubscriptionSchedulePhaseDTO])
  phases: BillingSubscriptionSchedulePhaseDTO[];

  @Field(() => [BillingSubscriptionItemDTO], { nullable: true })
  billingSubscriptionItems?: BillingSubscriptionItemDTO[] | null;
}
