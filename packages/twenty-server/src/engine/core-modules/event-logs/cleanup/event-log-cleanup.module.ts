import { Module } from '@nestjs/common';

import { EventLogCleanupCronCommand } from 'src/engine/core-modules/event-logs/cleanup/commands/event-log-cleanup.cron.command';
import { EventLogCleanupCronJob } from 'src/engine/core-modules/event-logs/cleanup/jobs/event-log-cleanup.cron.job';
import { EventLogsViewerModule } from 'src/engine/core-modules/event-logs/event-logs-viewer.module';

@Module({
  imports: [EventLogsViewerModule],
  providers: [EventLogCleanupCronJob, EventLogCleanupCronCommand],
  exports: [EventLogCleanupCronCommand],
})
export class EventLogCleanupModule {}
