import { MAX_RECURRING_CHARGE_MICRO_CREDITS_PER_PERIOD } from 'twenty-shared/application';

import { type DeclaredRecurringCharge } from 'src/engine/core-modules/billing/app-billing/utils/collect-declared-recurring-charges.util';
import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import { UsageResourceType } from 'src/engine/core-modules/usage/enums/usage-resource-type.enum';
import { UsageUnit } from 'src/engine/core-modules/usage/enums/usage-unit.enum';

type RecurringChargeUsageEvent = {
  resourceType: UsageResourceType;
  operationType: UsageOperationType;
  creditsUsedMicro: number;
  quantity: number;
  unit: UsageUnit;
  resourceId: string;
  resourceContext: string;
  spenders: { applicationId: string };
  periodStart: Date;
};

const resolveChargeQuantity = (
  charge: DeclaredRecurringCharge,
  workspaceMemberCount: number,
): { quantity: number; unit: UsageUnit } => {
  if (charge.charge.per === 'WORKSPACE_MEMBER') {
    return { quantity: workspaceMemberCount, unit: UsageUnit.SEAT };
  }

  return { quantity: 1, unit: UsageUnit.CREDIT };
};

// Billing stays inactive. This only turns a declared charge into a usage row
// when a caller still has one, and drops a total above the period cap.
export const buildRecurringChargeUsageEvents = ({
  dueCharges,
  workspaceMemberCount,
  periodStart,
}: {
  dueCharges: DeclaredRecurringCharge[];
  workspaceMemberCount: number;
  periodStart: Date;
}): {
  events: RecurringChargeUsageEvent[];
  rejectedCharges: DeclaredRecurringCharge[];
} => {
  const events: RecurringChargeUsageEvent[] = [];
  const rejectedCharges: DeclaredRecurringCharge[] = [];

  for (const dueCharge of dueCharges) {
    const { quantity, unit } = resolveChargeQuantity(
      dueCharge,
      workspaceMemberCount,
    );

    if (quantity <= 0) {
      continue;
    }

    const creditsUsedMicro = dueCharge.charge.amountMicroCredits * quantity;

    if (creditsUsedMicro > MAX_RECURRING_CHARGE_MICRO_CREDITS_PER_PERIOD) {
      rejectedCharges.push(dueCharge);
      continue;
    }

    events.push({
      resourceType: UsageResourceType.APP,
      operationType: UsageOperationType.SUBSCRIPTION,
      creditsUsedMicro,
      quantity,
      unit,
      resourceId: dueCharge.applicationId,
      resourceContext: dueCharge.chargeKey,
      spenders: { applicationId: dueCharge.applicationId },
      periodStart,
    });
  }

  return { events, rejectedCharges };
};
