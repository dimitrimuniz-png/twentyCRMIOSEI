import { Field, ID, ObjectType } from '@nestjs/graphql';

// Billing stays inactive. The type only exists so the workspace schema can build.
@ObjectType()
export class BillingSubscriptionEntity {
  private readonly commercialModuleRemoved = true;

  @Field(() => ID, { nullable: true })
  id?: string;
}
