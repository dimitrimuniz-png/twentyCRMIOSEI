import { Injectable } from '@nestjs/common';

import { type SubscriptionInactiveReason } from 'src/engine/core-modules/billing/types/subscription-inactive-reason.type';

@Injectable()
export class BillingUsageService {
  async getSubscriptionInactiveReason(
    _workspaceId: string,
  ): Promise<SubscriptionInactiveReason | null> {
    return null;
  }

  async getWorkspaceCreditsUsedMicroBetweenOrNull(_args: {
    workspaceId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<number | null> {
    return null;
  }
}
