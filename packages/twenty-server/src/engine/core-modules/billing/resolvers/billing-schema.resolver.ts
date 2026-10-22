import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { BillingEndTrialPeriodDTO } from 'src/engine/core-modules/billing/dtos/billing-end-trial-period.dto';
import { BillingPaymentIntentDTO } from 'src/engine/core-modules/billing/dtos/billing-payment-intent.dto';
import { BillingPlanDTO } from 'src/engine/core-modules/billing/dtos/billing-plan.dto';
import { BillingResourceCreditUsageDTO } from 'src/engine/core-modules/billing/dtos/billing-resource-credit-usage.dto';
import { BillingSessionDTO } from 'src/engine/core-modules/billing/dtos/billing-session.dto';
import { BillingUpdateDTO } from 'src/engine/core-modules/billing/dtos/billing-update.dto';
import { BillingSubscriptionEntity } from 'src/engine/core-modules/billing/entities/billing-subscription.entity';
import { BillingPlanKey } from 'src/engine/core-modules/billing/enums/billing-plan-key.enum';
import { SubscriptionInterval } from 'src/engine/core-modules/billing/enums/billing-subscription-interval.enum';
import { SubscriptionStatus } from 'src/engine/core-modules/billing/enums/billing-subscription-status.enum';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

const INACTIVE_SUBSCRIPTION_ID = '00000000-0000-0000-0000-000000000000';

// Commercial checkout is not part of this fork. The fields stay on the schema
// so the front documents validate, and every call reports an inactive account.
const inactiveSubscription = (): BillingSubscriptionEntity => ({
  id: INACTIVE_SUBSCRIPTION_ID,
  status: SubscriptionStatus.Canceled,
  metadata: {},
  phases: [],
  billingSubscriptionItems: [],
});

const inactiveBillingUpdate = (): BillingUpdateDTO => ({
  currentBillingSubscription: inactiveSubscription(),
  billingSubscriptions: [],
});

const inactivePaymentIntent = (): BillingPaymentIntentDTO => ({
  clientSecret: '',
  paymentIntentType: '',
});

@MetadataResolver()
export class BillingSchemaResolver {
  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Query(() => [BillingPlanDTO])
  listPlans(): BillingPlanDTO[] {
    return [];
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Query(() => BillingSessionDTO)
  billingPortalSession(
    @Args('returnUrlPath', { type: () => String, nullable: true })
    _returnUrlPath?: string,
    @Args('forPaymentMethodUpdate', { type: () => Boolean, nullable: true })
    _forPaymentMethodUpdate?: boolean,
  ): BillingSessionDTO {
    return { url: null };
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Query(() => [BillingResourceCreditUsageDTO])
  getResourceCreditUsage(): BillingResourceCreditUsageDTO[] {
    return [];
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingUpdateDTO)
  cancelSwitchBillingInterval(): BillingUpdateDTO {
    return inactiveBillingUpdate();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingUpdateDTO)
  cancelSwitchBillingPlan(): BillingUpdateDTO {
    return inactiveBillingUpdate();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingUpdateDTO)
  cancelSwitchResourceCreditPrice(): BillingUpdateDTO {
    return inactiveBillingUpdate();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingSessionDTO)
  checkoutSession(
    @Args('recurringInterval', { type: () => SubscriptionInterval })
    _recurringInterval: SubscriptionInterval,
    @Args('successUrlPath', { type: () => String, nullable: true })
    _successUrlPath: string | null,
    @Args('plan', { type: () => BillingPlanKey })
    _plan: BillingPlanKey,
    @Args('requirePaymentMethod', { type: () => Boolean })
    _requirePaymentMethod: boolean,
  ): BillingSessionDTO {
    return { url: null };
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingPaymentIntentDTO)
  createBillingPaymentMethodSetupIntent(): BillingPaymentIntentDTO {
    return inactivePaymentIntent();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingPaymentIntentDTO)
  createSubscriptionPaymentIntent(
    @Args('recurringInterval', { type: () => SubscriptionInterval })
    _recurringInterval: SubscriptionInterval,
    @Args('plan', { type: () => BillingPlanKey })
    _plan: BillingPlanKey,
    @Args('idempotencyKey', { type: () => String })
    _idempotencyKey: string,
  ): BillingPaymentIntentDTO {
    return inactivePaymentIntent();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingEndTrialPeriodDTO)
  endSubscriptionTrialPeriod(): BillingEndTrialPeriodDTO {
    return {
      status: null,
      hasPaymentMethod: false,
      billingPortalUrl: null,
      currentBillingSubscription: null,
      billingSubscriptions: [],
    };
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingUpdateDTO)
  setResourceCreditSubscriptionPrice(
    @Args('priceId', { type: () => String })
    _priceId: string,
  ): BillingUpdateDTO {
    return inactiveBillingUpdate();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingUpdateDTO)
  switchBillingPlan(
    @Args('plan', { type: () => BillingPlanKey, nullable: true })
    _plan?: BillingPlanKey,
  ): BillingUpdateDTO {
    return inactiveBillingUpdate();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => BillingUpdateDTO)
  switchSubscriptionInterval(): BillingUpdateDTO {
    return inactiveBillingUpdate();
  }
}
