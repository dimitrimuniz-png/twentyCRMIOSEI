import { Injectable } from '@nestjs/common';

@Injectable()
export class EventLogRetentionService {
  // Retention bounds are enforced by the workspace input validator.
  // This fork does not require a commercial entitlement to change them.
  async validateRetentionUpdateOrThrow(_workspaceId: string): Promise<void> {
    return;
  }
}
