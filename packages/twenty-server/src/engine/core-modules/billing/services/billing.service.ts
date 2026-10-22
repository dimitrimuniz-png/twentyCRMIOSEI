import { Injectable } from '@nestjs/common';

import { BillingEntitlementKey } from 'src/engine/core-modules/billing/enums/billing-entitlement-key.enum';
import { UserCreditsFallback } from 'src/engine/core-modules/billing/enums/billing-user-credits-fallback.enum';
import { BillingCustomerEntity } from 'src/engine/core-modules/billing/entities/billing-customer.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

// Commercial checkout stays off. With billing disabled, a workspace still
// activates and locally configured usage limits stay enforceable.
@Injectable()
export class BillingService {
  private readonly userCreditsFallbackByWorkspaceId = new Map<
    string,
    UserCreditsFallback
  >();

  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  isBillingEnabled(): boolean {
    return this.twentyConfigService.isBillingEnabled();
  }

  async hasWorkspaceAnySubscription(_workspaceId: string): Promise<boolean> {
    return !this.isBillingEnabled();
  }

  async isSubscriptionIncompleteOnboardingStatus(
    _workspaceId: string,
  ): Promise<boolean> {
    return false;
  }

  async hasEntitlement(
    _workspaceId: string,
    _entitlementKey: BillingEntitlementKey,
  ): Promise<boolean> {
    return false;
  }

  async isPayingCustomer(_workspaceId: string): Promise<boolean> {
    return false;
  }

  async ensureBillingCustomer(_input: {
    userEmail: string;
    workspaceId: string;
    workspaceDisplayName?: string;
    partner?: unknown;
  }): Promise<void> {
    return;
  }

  getUserCreditsFallback(workspaceId: string): UserCreditsFallback {
    return (
      this.userCreditsFallbackByWorkspaceId.get(workspaceId) ??
      UserCreditsFallback.WORKSPACE_CREDITS
    );
  }

  setUserCreditsFallback(
    workspaceId: string,
    userCreditsFallback: UserCreditsFallback,
  ): BillingCustomerEntity {
    this.userCreditsFallbackByWorkspaceId.set(workspaceId, userCreditsFallback);

    return this.getBillingCustomer(workspaceId);
  }

  getBillingCustomer(workspaceId: string): BillingCustomerEntity {
    return {
      id: workspaceId,
      userCreditsFallback: this.getUserCreditsFallback(workspaceId),
    };
  }
}
