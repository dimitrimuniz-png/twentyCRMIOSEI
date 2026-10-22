import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { UserCreditsFallback } from 'src/engine/core-modules/billing/enums/billing-user-credits-fallback.enum';

// Billing stays inactive. The type only exists so the metadata schema matches
// the documents the front already sends.
@ObjectType('BillingCustomer')
export class BillingCustomerEntity {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => Boolean, { nullable: true })
  hasPaymentMethod?: boolean | null;

  @Field(() => UserCreditsFallback)
  userCreditsFallback: UserCreditsFallback;
}
