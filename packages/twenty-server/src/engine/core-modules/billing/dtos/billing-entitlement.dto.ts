import { Field, ObjectType } from '@nestjs/graphql';

import { BillingEntitlementKey } from 'src/engine/core-modules/billing/enums/billing-entitlement-key.enum';

// Billing stays inactive. The type only exists so the metadata schema matches
// the documents the front already sends.
@ObjectType('BillingEntitlement')
export class BillingEntitlementDTO {
  @Field(() => BillingEntitlementKey)
  key: BillingEntitlementKey;

  @Field(() => Boolean)
  value: boolean;
}
