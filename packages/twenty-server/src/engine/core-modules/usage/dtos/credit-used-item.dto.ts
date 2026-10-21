import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('CreditUsedItem')
export class CreditUsedItemDTO {
  @Field(() => String, { nullable: true })
  key?: string;

  @Field(() => String, { nullable: true })
  label?: string;

  @Field(() => Float)
  creditsUsed: number;
}
