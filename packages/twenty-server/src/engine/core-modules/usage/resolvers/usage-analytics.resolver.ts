import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import {
  UsageAnalyticsDTO,
  UsageAnalyticsInput,
} from 'src/engine/core-modules/usage/dtos/usage-analytics.dto';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

const emptyUsageAnalytics = (
  input?: UsageAnalyticsInput,
): UsageAnalyticsDTO => {
  const periodEnd = input?.periodEnd ?? new Date();
  const periodStart = input?.periodStart ?? periodEnd;

  return {
    periodStart,
    periodEnd,
    timeSeries: [],
    usageByApplication: [],
    usageByModel: [],
    usageByOperationType: [],
    usageByUser: [],
    userDailyUsage: null,
  };
};

@MetadataResolver()
export class UsageAnalyticsResolver {
  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Query(() => UsageAnalyticsDTO)
  getUsageAnalytics(
    @Args('input', { type: () => UsageAnalyticsInput, nullable: true })
    input?: UsageAnalyticsInput,
  ): UsageAnalyticsDTO {
    return emptyUsageAnalytics(input);
  }
}
