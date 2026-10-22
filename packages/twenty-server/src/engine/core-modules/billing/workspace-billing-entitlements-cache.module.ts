import { Module } from '@nestjs/common';

import { BillingModule } from 'src/engine/core-modules/billing/billing.module';
import { WorkspaceBillingEntitlementsCacheService } from 'src/engine/core-modules/billing/services/workspace-billing-entitlements-cache.service';
import { EnterpriseModule } from 'src/engine/core-modules/enterprise/enterprise.module';

@Module({
  imports: [EnterpriseModule, BillingModule],
  providers: [WorkspaceBillingEntitlementsCacheService],
  exports: [WorkspaceBillingEntitlementsCacheService, BillingModule],
})
export class WorkspaceBillingEntitlementsCacheModule {}
