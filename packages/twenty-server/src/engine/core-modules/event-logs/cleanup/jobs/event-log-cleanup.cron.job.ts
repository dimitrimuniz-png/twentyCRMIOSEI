import { Injectable, Logger } from '@nestjs/common';

import { EVENT_LOG_CLEANUP_CRON_PATTERN } from 'src/engine/core-modules/event-logs/cleanup/constants/event-log-cleanup-cron-pattern.constant';
import { EventLogsService } from 'src/engine/core-modules/event-logs/event-logs.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

@Injectable()
@Processor(MessageQueue.cronQueue)
export class EventLogCleanupCronJob {
  private readonly logger = new Logger(EventLogCleanupCronJob.name);

  constructor(private readonly eventLogsService: EventLogsService) {}

  @Process(EventLogCleanupCronJob.name)
  async handle(): Promise<void> {
    const deletedCount = await this.eventLogsService.deleteExpired();

    if (deletedCount > 0) {
      this.logger.log(`Deleted ${deletedCount} expired audit log row(s)`);
    }
  }
}

export const EVENT_LOG_CLEANUP_JOB_PATTERN = EVENT_LOG_CLEANUP_CRON_PATTERN;
