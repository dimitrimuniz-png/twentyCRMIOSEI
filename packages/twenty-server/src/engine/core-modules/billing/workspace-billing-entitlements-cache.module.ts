import { Module } from '@nestjs/common';

import { EnterpriseModule } from 'src/engine/core-modules/enterprise/enterprise.module';
import { WorkspaceBillingEntitlementsCacheService } from 'src/engine/core-modules/billing/services/workspace-billing-entitlements-cache.service';
import { UpdateSubscriptionQuantityJob } from 'src/engine/core-modules/billing/jobs/update-subscription-quantity.job';
import { BillingGraphqlApiExceptionFilter } from 'src/engine/core-modules/billing/filters/billing-graphql-api-exception.filter';
import { BillingRestApiExceptionFilter } from 'src/engine/core-modules/billing/filters/billing-api-exception.filter';
import { BillingCreditRolloverService } from 'src/engine/core-modules/billing/services/billing-credit-rollover.service';
import { BillingCreditAllowanceService } from 'src/engine/core-modules/billing/services/billing-credit-allowance.service';
import { BillingCreditOneTimeTopUpService } from 'src/engine/core-modules/billing/services/billing-credit-one-time-top-up.service';
import { BillingCreditService } from 'src/engine/core-modules/billing/services/billing-credit.service';
import { BillingService } from 'src/engine/core-modules/billing/services/billing.service';
import { BillingCreditGrantService } from 'src/engine/core-modules/billing/services/billing-credit-grant.service';
import { BillingSubscriptionItemService } from 'src/engine/core-modules/billing/services/billing-subscription-item.service';
import { BillingUsageService } from 'src/engine/core-modules/billing/services/billing-usage.service';
import { ResourceCreditService } from 'src/engine/core-modules/billing/services/resource-credit.service';
import { BillingSubscriptionService } from 'src/engine/core-modules/billing/services/billing-subscription.service';

@Module({
  imports: [EnterpriseModule],
  providers: [
    WorkspaceBillingEntitlementsCacheService,
    UpdateSubscriptionQuantityJob,
    BillingGraphqlApiExceptionFilter,
    BillingRestApiExceptionFilter,
    BillingCreditRolloverService,
    BillingCreditAllowanceService,
    BillingCreditOneTimeTopUpService,
    BillingCreditService,
    BillingService,
    BillingCreditGrantService,
    BillingSubscriptionItemService,
    BillingUsageService,
    ResourceCreditService,
    BillingSubscriptionService,
  ],
  exports: [
    WorkspaceBillingEntitlementsCacheService,
    UpdateSubscriptionQuantityJob,
    BillingGraphqlApiExceptionFilter,
    BillingRestApiExceptionFilter,
    BillingCreditRolloverService,
    BillingCreditAllowanceService,
    BillingCreditOneTimeTopUpService,
    BillingCreditService,
    BillingService,
    BillingCreditGrantService,
    BillingSubscriptionItemService,
    BillingUsageService,
    ResourceCreditService,
    BillingSubscriptionService,
  ],
})
export class WorkspaceBillingEntitlementsCacheModule {}
