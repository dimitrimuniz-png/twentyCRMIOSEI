import { Injectable } from '@nestjs/common';

import { UserCreditsFallback } from 'src/engine/core-modules/billing/enums/billing-user-credits-fallback.enum';
import { BillingService } from 'src/engine/core-modules/billing/services/billing.service';
import { type CreditAllowanceGrant } from 'src/engine/core-modules/usage-limit/types/credit-allowance-grant.type';

type CreditAllowance = {
  periodStart: Date;
  periodEnd: Date;
  planAllowanceMicro: number;
  grants: CreditAllowanceGrant[];
};

@Injectable()
export class BillingCreditAllowanceService {
  constructor(private readonly billingService: BillingService) {}

  async getUserCreditsFallback(
    workspaceId: string,
  ): Promise<UserCreditsFallback> {
    return this.billingService.getUserCreditsFallback(workspaceId);
  }

  async isCreditAllowanceEnabled(): Promise<boolean> {
    return false;
  }

  async getPlanKey(_workspaceId: string): Promise<string | null> {
    return null;
  }

  async getCreditAllowance(
    _workspaceId: string,
  ): Promise<CreditAllowance | null> {
    return null;
  }
}
