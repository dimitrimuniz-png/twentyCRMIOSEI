import { EventLogRetentionService } from 'src/engine/core-modules/event-logs/retention/services/event-log-retention.service';

describe('EventLogRetentionService', () => {
  it('accepts a retention change without a commercial entitlement', async () => {
    const service = new EventLogRetentionService();

    await expect(
      service.validateRetentionUpdateOrThrow('workspace-id'),
    ).resolves.toBeUndefined();
  });
});
