import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type UsageRefusal } from 'src/engine/core-modules/billing/types/usage-refusal.type';
import { UsageLimitQuotaService } from 'src/engine/core-modules/usage-limit/services/usage-limit-quota.service';
import { type QuotaCost } from 'src/engine/core-modules/usage-limit/types/quota-cost.type';
import { buildQuotaExhaustedException } from 'src/engine/core-modules/usage-limit/utils/build-quota-exhausted-exception.util';
import { type UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import { type UsageResourceType } from 'src/engine/core-modules/usage/enums/usage-resource-type.enum';
import { type UsageSpenders } from 'src/engine/core-modules/usage/types/usage-spenders.type';

type UsageAdmissionArgs = {
  workspaceId: string;
  resourceType: UsageResourceType;
  operationType: UsageOperationType;
  spenders: UsageSpenders;
  cost?: QuotaCost;
};

@Injectable()
export class UsageQuotaAdmissionService {
  constructor(
    private readonly usageLimitQuotaService: UsageLimitQuotaService,
  ) {}

  async assertUsageAllowed(args: UsageAdmissionArgs): Promise<void> {
    const exhaustedScope =
      await this.usageLimitQuotaService.findExhaustedScope(args);

    if (isDefined(exhaustedScope)) {
      throw buildQuotaExhaustedException(exhaustedScope);
    }
  }

  async findUsageRefusal(
    args: UsageAdmissionArgs,
  ): Promise<UsageRefusal | null> {
    const exhaustedScope =
      await this.usageLimitQuotaService.findExhaustedScope(args);

    if (!isDefined(exhaustedScope)) {
      return null;
    }

    return { kind: 'quotaExhausted', exhaustedScope };
  }
}
