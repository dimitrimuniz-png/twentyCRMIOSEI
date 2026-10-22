import { Injectable } from '@nestjs/common';

@Injectable()
export class AppBillingService {
  async emitChargeEvent(_event: {
    workspaceId: string;
    applicationId: string;
    creditsUsedMicro?: number;
    quantity?: number;
    operationType?: string;
  }): Promise<void> {
    return;
  }
}
