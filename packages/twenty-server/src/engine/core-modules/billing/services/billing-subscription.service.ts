import { Injectable } from '@nestjs/common';

import { BillingEntitlementKey } from 'src/engine/core-modules/billing/enums/billing-entitlement-key.enum';
import { type BillingCustomerEntity } from 'src/engine/core-modules/billing/entities/billing-customer.entity';
import { type BillingSubscriptionEntity } from 'src/engine/core-modules/billing/entities/billing-subscription.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Injectable()
export class BillingSubscriptionService {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  async getWorkspaceEntitlementValue(
    _workspaceId: string,
    entitlementKey: BillingEntitlementKey,
  ): Promise<boolean> {
    return (
      !this.twentyConfigService.isBillingEnabled() &&
      entitlementKey === BillingEntitlementKey.USAGE_LIMIT
    );
  }

  async getBillingSubscriptions(
    _workspaceId: string,
  ): Promise<BillingSubscriptionEntity[]> {
    return [];
  }

  async getCurrentBillingSubscription(_args: {
    workspaceId: string;
  }): Promise<BillingSubscriptionEntity | undefined> {
    return undefined;
  }

  async getBillingCustomer(
    _workspaceId: string,
  ): Promise<BillingCustomerEntity | null> {
    return null;
  }

  getWorkspaceEntitlements(_workspaceId: string): [] {
    return [];
  }

  async cancelSubscription(_workspaceId: string): Promise<void> {
    return;
  }

  async assertSubscriptionCanceledOrNone(_workspaceId: string): Promise<void> {
    return;
  }
}
