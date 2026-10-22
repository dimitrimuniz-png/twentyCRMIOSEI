import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { type Request } from 'express';
import { ApiPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { AppBillingService } from 'src/engine/core-modules/billing/app-billing/app-billing.service';
import { type SubscriptionInactiveReason } from 'src/engine/core-modules/billing/types/subscription-inactive-reason.type';
import { BillingUsageService } from 'src/engine/core-modules/billing/services/billing-usage.service';
import { UsageLimitQuotaService } from 'src/engine/core-modules/usage-limit/services/usage-limit-quota.service';
import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import { UsageResourceType } from 'src/engine/core-modules/usage/enums/usage-resource-type.enum';
import { UsageUnit } from 'src/engine/core-modules/usage/enums/usage-unit.enum';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';

type CreditAvailabilityResponse =
  | { hasAvailableCredits: true }
  | {
      hasAvailableCredits: false;
      reason: 'workspace-suspended' | 'no-subscription' | 'no-credits';
    };

const subscriptionInactiveReasonToCreditReason = (
  reason: SubscriptionInactiveReason,
): 'workspace-suspended' | 'no-subscription' =>
  reason === 'WORKSPACE_SUSPENDED' ? 'workspace-suspended' : 'no-subscription';

@Controller(`${ApiPath.App}/billing`)
@UseGuards(
  JwtAuthGuard,
  AuthPrincipalGuard({
    userSession: false,
    apiKey: false,
    oauthClient: false,
    application: { withUser: true, withoutUser: true },
  }),
  NoPermissionGuard,
)
export class AppBillingController {
  constructor(
    private readonly appBillingService: AppBillingService,
    private readonly billingUsageService: BillingUsageService,
    private readonly usageLimitQuotaService: UsageLimitQuotaService,
  ) {}

  @Get('credits')
  async credits(@Req() request: Request): Promise<CreditAvailabilityResponse> {
    const { applicationId, workspaceId } = this.requireAppContext(request);
    const subscriptionInactiveReason =
      await this.billingUsageService.getSubscriptionInactiveReason(workspaceId);

    if (isDefined(subscriptionInactiveReason)) {
      return {
        hasAvailableCredits: false,
        reason: subscriptionInactiveReasonToCreditReason(
          subscriptionInactiveReason,
        ),
      };
    }

    const exhaustedScope = await this.usageLimitQuotaService.findExhaustedScope(
      {
        workspaceId,
        resourceType: UsageResourceType.APP,
        operationType: UsageOperationType.AI_CHAT_TOKEN,
        spenders: { applicationId },
        cost: { [UsageUnit.CREDIT]: 1 },
      },
    );

    if (isDefined(exhaustedScope)) {
      return { hasAvailableCredits: false, reason: 'no-credits' };
    }

    return { hasAvailableCredits: true };
  }

  @Post('charge')
  @HttpCode(HttpStatus.NO_CONTENT)
  async charge(
    @Req() request: Request,
    @Body()
    body: {
      creditsUsedMicro?: number;
      quantity?: number;
      operationType?: string;
    },
  ): Promise<void> {
    const { applicationId, workspaceId } = this.requireAppContext(request);

    await this.appBillingService.emitChargeEvent({
      workspaceId,
      applicationId,
      creditsUsedMicro: body.creditsUsedMicro,
      quantity: body.quantity,
      operationType: body.operationType,
    });
  }

  private requireAppContext(request: Request): {
    applicationId: string;
    workspaceId: string;
  } {
    if (!isDefined(request.application) || !isDefined(request.workspace)) {
      throw new ForbiddenException(
        'This endpoint requires an APPLICATION_ACCESS token.',
      );
    }

    return {
      applicationId: request.application.id,
      workspaceId: request.workspace.id,
    };
  }
}
