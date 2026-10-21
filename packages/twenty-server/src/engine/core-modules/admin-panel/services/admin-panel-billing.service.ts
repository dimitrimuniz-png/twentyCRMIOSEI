import { Injectable } from '@nestjs/common';

import { type AdminPanelWorkspaceBillingDTO } from 'src/engine/core-modules/admin-panel/dtos/admin-panel-workspace-billing.dto';
import { type AdminPanelWorkspaceCreditGrantDTO } from 'src/engine/core-modules/admin-panel/dtos/admin-panel-workspace-credit-grant.dto';
import {
  BillingException,
  BillingExceptionCode,
} from 'src/engine/core-modules/billing/billing.exception';
import { type BillingCreditGrantType } from 'src/engine/core-modules/billing/enums/billing-credit-grant-type.enum';

@Injectable()
export class AdminPanelBillingService {
  async grantWorkspaceCredits(_input: {
    workspaceId: string;
    amount: number;
    type: BillingCreditGrantType;
    reason?: string;
    expiresInDays?: number;
    clientOperationId: string;
    grantedByUserId: string;
  }): Promise<AdminPanelWorkspaceCreditGrantDTO> {
    throw new BillingException(
      'Billing is not available on this self-hosted build',
      BillingExceptionCode.BILLING_CUSTOMER_NOT_FOUND,
    );
  }

  async revokeWorkspaceCreditGrant(_input: {
    workspaceId: string;
    creditGrantId: string;
    revokedByUserId: string;
  }): Promise<AdminPanelWorkspaceCreditGrantDTO> {
    throw new BillingException(
      'Billing is not available on this self-hosted build',
      BillingExceptionCode.BILLING_CUSTOMER_NOT_FOUND,
    );
  }

  async getWorkspaceBilling(
    _workspaceId: string,
  ): Promise<AdminPanelWorkspaceBillingDTO | null> {
    return null;
  }
}
