import { Command, CommandRunner } from 'nest-commander';

import { EVENT_LOG_CLEANUP_CRON_PATTERN } from 'src/engine/core-modules/event-logs/cleanup/constants/event-log-cleanup-cron-pattern.constant';
import { EventLogCleanupCronJob } from 'src/engine/core-modules/event-logs/cleanup/jobs/event-log-cleanup.cron.job';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

@Command({
  name: 'cron:event-log-cleanup',
  description: 'Deletes audit log rows older than each workspace retention',
})
export class EventLogCleanupCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: EventLogCleanupCronJob.name,
      data: undefined,
      options: {
        repeat: {
          pattern: EVENT_LOG_CLEANUP_CRON_PATTERN,
        },
      },
    });
  }
}
