import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';

import { UsageBreakdownItemDTO } from 'src/engine/core-modules/usage/dtos/usage-breakdown-item.dto';
import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';

@ObjectType('UsageTimeSeries')
export class UsageTimeSeriesDTO {
  @Field(() => String)
  date: string;

  @Field(() => Float)
  creditsUsed: number;

  @Field(() => Float)
  workspaceCreditsUsed: number;
}

@ObjectType('UsageUserDaily')
export class UsageUserDailyDTO {
  @Field(() => String)
  userWorkspaceId: string;

  @Field(() => [UsageTimeSeriesDTO])
  dailyUsage: UsageTimeSeriesDTO[];
}

@ObjectType('UsageAnalytics')
export class UsageAnalyticsDTO {
  @Field(() => Date)
  periodStart: Date;

  @Field(() => Date)
  periodEnd: Date;

  @Field(() => [UsageTimeSeriesDTO])
  timeSeries: UsageTimeSeriesDTO[];

  @Field(() => [UsageBreakdownItemDTO])
  usageByApplication: UsageBreakdownItemDTO[];

  @Field(() => [UsageBreakdownItemDTO])
  usageByModel: UsageBreakdownItemDTO[];

  @Field(() => [UsageBreakdownItemDTO])
  usageByOperationType: UsageBreakdownItemDTO[];

  @Field(() => [UsageBreakdownItemDTO])
  usageByUser: UsageBreakdownItemDTO[];

  @Field(() => UsageUserDailyDTO, { nullable: true })
  userDailyUsage?: UsageUserDailyDTO | null;
}

@InputType('UsageAnalyticsInput')
export class UsageAnalyticsInput {
  @Field(() => [UsageOperationType], { nullable: true })
  operationTypes?: UsageOperationType[];

  @Field(() => Date, { nullable: true })
  periodEnd?: Date;

  @Field(() => Date, { nullable: true })
  periodStart?: Date;

  @Field(() => String, { nullable: true })
  userWorkspaceId?: string;
}
