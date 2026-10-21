import { Injectable, Logger } from '@nestjs/common';

import { EventLogEmitterService } from 'src/engine/core-modules/event-logs/emit/event-log-emitter.service';
import { type UsageEvent } from 'src/engine/core-modules/usage/types/usage-event.type';
import { buildUsageEventEnvelopes } from 'src/engine/core-modules/usage/utils/build-usage-event-envelopes';
import { type CustomWorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/custom-workspace-batch-event.type';

@Injectable()
export class UsageEventListener {
  private readonly logger = new Logger(UsageEventListener.name);

  constructor(
    private readonly eventLogEmitterService: EventLogEmitterService,
  ) {}

  async handleUsageRecordedEvent(
    batch: CustomWorkspaceEventBatch<UsageEvent>,
  ): Promise<void> {
    if (!batch.workspaceId || !this.eventLogEmitterService.isEnabled()) {
      return;
    }

    try {
      await this.eventLogEmitterService.dispatch(
        buildUsageEventEnvelopes(batch.workspaceId, batch.events),
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
