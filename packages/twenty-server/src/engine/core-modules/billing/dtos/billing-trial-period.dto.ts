import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('BillingTrialPeriod')
export class BillingTrialPeriodDTO {
  @Field(() => Int)
  duration: number;

  @Field(() => Boolean)
  isCreditCardRequired: boolean;
}
