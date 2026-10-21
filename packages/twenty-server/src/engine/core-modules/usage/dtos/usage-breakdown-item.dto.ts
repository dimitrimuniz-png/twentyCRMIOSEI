import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('UsageBreakdownItem')
export class UsageBreakdownItemDTO {
  @Field(() => String)
  key: string;

  @Field(() => String)
  label: string;

  @Field(() => Float)
  creditsUsed: number;

  @Field(() => Float)
  userCreditsUsed: number;

  @Field(() => Float)
  workspaceCreditsUsed: number;
}
