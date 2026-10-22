import { Module } from '@nestjs/common';

import { ClickHouseModule } from 'src/database/clickhouse/clickhouse.module';
import { EventLogEmitterModule } from 'src/engine/core-modules/event-logs/emit/event-log-emitter.module';
import { UsageAnalyticsService } from 'src/engine/core-modules/usage/services/usage-analytics.service';
import { UsageRecorderService } from 'src/engine/core-modules/usage/services/usage-recorder.service';

@Module({
  imports: [ClickHouseModule, EventLogEmitterModule],
  providers: [UsageAnalyticsService, UsageRecorderService],
  exports: [UsageAnalyticsService, UsageRecorderService],
})
export class UsageAnalyticsModule {}
