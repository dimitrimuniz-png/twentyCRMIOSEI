import { Module } from '@nestjs/common';

import { UsageAnalyticsService } from 'src/engine/core-modules/usage/services/usage-analytics.service';
import { UsageRecorderService } from 'src/engine/core-modules/usage/services/usage-recorder.service';

@Module({
  providers: [
    UsageAnalyticsService,
    UsageRecorderService,
  ],
  exports: [
    UsageAnalyticsService,
    UsageRecorderService,
  ],
})
export class UsageModule {}
