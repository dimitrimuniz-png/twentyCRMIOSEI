import { Module } from '@nestjs/common';

import { ClickHouseModule } from 'src/database/clickhouse/clickhouse.module';
import { UsageAnalyticsResolver } from 'src/engine/core-modules/usage/resolvers/usage-analytics.resolver';
import { UsageAnalyticsService } from 'src/engine/core-modules/usage/services/usage-analytics.service';
import { UsageRecorderService } from 'src/engine/core-modules/usage/services/usage-recorder.service';

@Module({
  imports: [ClickHouseModule],
  providers: [
    UsageAnalyticsService,
    UsageRecorderService,
    UsageAnalyticsResolver,
  ],
  exports: [UsageAnalyticsService, UsageRecorderService],
})
export class UsageModule {}
