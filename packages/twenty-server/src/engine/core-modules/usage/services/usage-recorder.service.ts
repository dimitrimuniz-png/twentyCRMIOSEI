import { Injectable, Logger } from '@nestjs/common';

import { EventLogEmitterService } from 'src/engine/core-modules/event-logs/emit/event-log-emitter.service';
import { type UsageEvent } from 'src/engine/core-modules/usage/types/usage-event.type';
import { buildUsageEventEnvelopes } from 'src/engine/core-modules/usage/utils/build-usage-event-envelopes';

@Injectable()
export class UsageRecorderService {
  private readonly logger = new Logger(UsageRecorderService.name);
  private readonly pendingEventsByWorkspaceId = new Map<string, UsageEvent[]>();

  constructor(
    private readonly eventLogEmitterService: EventLogEmitterService,
  ) {}

  isEnabled(): boolean {
    return this.eventLogEmitterService.isEnabled();
  }

  async record(workspaceId: string, events: UsageEvent[]): Promise<void> {
    if (events.length === 0 || !this.isEnabled()) {
      return;
    }

    try {
      await this.eventLogEmitterService.dispatch(
        buildUsageEventEnvelopes(workspaceId, events),
      );
    } catch (error) {
      // A missing analytics store must not fail the operation that was charged.
      this.logger.error(error);
    }
  }

  accumulate(workspaceId: string, event: UsageEvent): void {
    const pendingEvents =
      this.pendingEventsByWorkspaceId.get(workspaceId) ?? [];

    pendingEvents.push(event);
    this.pendingEventsByWorkspaceId.set(workspaceId, pendingEvents);
  }

  async flushAndStop(): Promise<void> {
    const batches = [...this.pendingEventsByWorkspaceId.entries()];

    this.pendingEventsByWorkspaceId.clear();

    await Promise.all(
      batches.map(([workspaceId, events]) => this.record(workspaceId, events)),
    );
  }
}
