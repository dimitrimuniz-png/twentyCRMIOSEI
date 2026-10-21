import { Injectable } from '@nestjs/common';

import { BillingEntitlementKey } from 'src/engine/core-modules/billing/enums/billing-entitlement-key.enum';
import { type BillingEntitlements } from 'src/engine/core-modules/billing/types/billing-entitlements.type';
import { isEntitlementActive } from 'src/engine/core-modules/billing/utils/is-entitlement-active.util';
import { EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceCache } from 'src/engine/workspace-cache/decorators/workspace-cache.decorator';
import { WorkspaceCacheProvider } from 'src/engine/workspace-cache/interfaces/workspace-cache-provider.service';

// The billing catalog is not a TypeORM entity here, so this provider does not
// load its rows. Active keys come from isEntitlementActive with no Stripe grant.
@Injectable()
@WorkspaceCache('billingEntitlements', { packingPonderation: 1 })
export class WorkspaceBillingEntitlementsCacheService extends WorkspaceCacheProvider<BillingEntitlements> {
  constructor(
    private readonly enterprisePlanService: EnterprisePlanService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {
    super();
  }

  override computeForCache(): BillingEntitlements {
    const hasValidEnterprisePlan = this.enterprisePlanService.isValid();
    const isBillingEnabled = this.twentyConfigService.get('IS_BILLING_ENABLED');
    const entitlements: BillingEntitlements = {};

    for (const key of Object.values(BillingEntitlementKey)) {
      if (
        isEntitlementActive({
          key,
          hasValidEnterprisePlan,
          isBillingEnabled,
          stripeEntitlementValue: false,
        })
      ) {
        entitlements[key] = true;
      }
    }

    return entitlements;
  }
}
