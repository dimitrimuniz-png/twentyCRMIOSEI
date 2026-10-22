import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { BillingEndTrialPeriodDTO } from 'src/engine/core-modules/billing/dtos/billing-end-trial-period.dto';
import { BillingPaymentIntentDTO } from 'src/engine/core-modules/billing/dtos/billing-payment-intent.dto';
import { BillingPlanDTO } from 'src/engine/core-modules/billing/dtos/billing-plan.dto';
import { BillingResourceCreditUsageDTO } from 'src/engine/core-modules/billing/dtos/billing-resource-credit-usage.dto';
import { BillingSessionDTO } from 'src/engine/core-modules/billing/dtos/billing-session.dto';
import { BillingUpdateDTO } from 'src/engine/core-modules/billing/dtos/billing-update.dto';
import { BillingCustomerEntity } from 'src/engine/core-modules/billing/entities/billing-customer.entity';
import { BillingSubscriptionEntity } from 'src/engine/core-modules/billing/entities/billing-subscription.entity';
import {
  BillingException,
  BillingExceptionCode,
} from 'src/engine/core-modules/billing/billing.exception';
import { BillingPlanKey } from 'src/engine/core-modules/billing/enums/billing-plan-key.enum';
import { BillingGraphqlApiExceptionFilter } from 'src/engine/core-modules/billing/filters/billing-graphql-api-exception.filter';
import { SubscriptionInterval } from 'src/engine/core-modules/billing/enums/billing-subscription-interval.enum';
import { SubscriptionStatus } from 'src/engine/core-modules/billing/enums/billing-subscription-status.enum';
import { UserCreditsFallback } from 'src/engine/core-modules/billing/enums/billing-user-credits-fallback.enum';
import { BillingService } from 'src/engine/core-modules/billing/services/billing.service';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

const INACTIVE_SUBSCRIPTION_ID = '00000000-0000-0000-0000-000000000000';

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

@UseFilters(BillingGraphqlApiExceptionFilter)
@MetadataResolver()
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: true, withoutUser: true },
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: true, withoutUser: true },
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      apiKey: false,
      oauthClient: { withUser: true, withoutUser: false },
      application: { withUser: true, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
  )
  @Mutation(() => BillingSessionDTO)
  checkoutSession(
    @Args('recurringInterval', { type: () => SubscriptionInterval })
    _recurringInterval: SubscriptionInterval,
    @Args('successUrlPath', { type: () => String, nullable: true })
    _successUrlPath?: string | null,
    @Args('plan', { type: () => BillingPlanKey, nullable: true })
    _plan?: BillingPlanKey | null,
    @Args('requirePaymentMethod', { type: () => Boolean, nullable: true })
    _requirePaymentMethod?: boolean | null,
  ): BillingSessionDTO {
    // Permission already passed. Checkout still cannot open: this build has
    // no Stripe account, and billing stays off unless the instance enables it.
    if (!this.billingService.isBillingEnabled()) {
      throw new BillingException(
        'Billing is disabled',
        BillingExceptionCode.BILLING_SUBSCRIPTION_INACTIVE,
      );
    }

    throw new BillingException(
      'Billing checkout is not configured',
      BillingExceptionCode.BILLING_STRIPE_ERROR,
    );
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      apiKey: false,
      oauthClient: { withUser: true, withoutUser: false },
      application: { withUser: true, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
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
      oauthClient: { withUser: true, withoutUser: true },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
  )
  @Mutation(() => BillingUpdateDTO)
  switchSubscriptionInterval(): BillingUpdateDTO {
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
      apiKey: false,
      oauthClient: { withUser: false, withoutUser: false },
      application: { withUser: false, withoutUser: false },
    }),
    SettingsPermissionGuard(PermissionFlagType.BILLING),
  )
  @Mutation(() => BillingCustomerEntity)
  updateUserCreditsFallback(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('userCreditsFallback', { type: () => UserCreditsFallback })
    userCreditsFallback: UserCreditsFallback,
  ): BillingCustomerEntity {
    return this.billingService.setUserCreditsFallback(
      workspace.id,
      userCreditsFallback,
    );
  }
}
