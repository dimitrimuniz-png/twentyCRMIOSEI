import { Field, Float, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { BillingProductDTO } from 'src/engine/core-modules/billing/dtos/billing-product.dto';

@ObjectType('BillingSubscriptionItem')
export class BillingSubscriptionItemDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => Boolean)
  hasReachedCurrentPeriodCap: boolean;

  @Field(() => Float, { nullable: true })
  quantity?: number | null;

  @Field(() => String)
  stripePriceId: string;

  @Field(() => Float, { nullable: true })
  unitAmount?: number | null;

  @Field(() => Float, { nullable: true })
  creditAmount?: number | null;

  @Field(() => BillingProductDTO)
  billingProduct: BillingProductDTO;
}
