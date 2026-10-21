import { Field, ObjectType } from '@nestjs/graphql';

// Billing stays inactive. The type only exists so the workspace schema can build.
@ObjectType()
export class BillingEntitlementDTO {
  @Field(() => String, { nullable: true })
  key?: string;
}
