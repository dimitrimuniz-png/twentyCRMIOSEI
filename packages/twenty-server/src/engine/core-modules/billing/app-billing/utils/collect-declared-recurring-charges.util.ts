import {
  isRecurringCharge,
  type RecurringCharge,
} from 'twenty-shared/application';
import { isDefined, isPlainObject } from 'twenty-shared/utils';

import { type FlatApplicationCacheMaps } from 'src/engine/core-modules/application/types/flat-application-cache-maps.type';

export type DeclaredRecurringCharge = {
  applicationId: string;
  chargeKey: string;
  charge: RecurringCharge;
};

export type RejectedRecurringChargeDeclaration = {
  applicationId: string;
  chargeKey: string;
  reason: string;
};

const MALFORMED_RECURRING_CHARGE_REASON =
  'malformed or out-of-bounds recurring charge declaration';

// Declarations arrive as untrusted jsonb. An array is an object, so it must
// not be walked with Object.entries or each element would be billed by index.
export const collectDeclaredRecurringCharges = ({
  flatApplicationMaps,
}: {
  flatApplicationMaps: FlatApplicationCacheMaps;
}): {
  declaredCharges: DeclaredRecurringCharge[];
  rejectedCharges: RejectedRecurringChargeDeclaration[];
} => {
  const declaredCharges: DeclaredRecurringCharge[] = [];
  const rejectedCharges: RejectedRecurringChargeDeclaration[] = [];

  for (const application of Object.values(flatApplicationMaps.byId)) {
    if (!isDefined(application) || isDefined(application.deletedAt)) {
      continue;
    }

    const recurring = application.billing?.recurring;

    if (!isPlainObject(recurring)) {
      continue;
    }

    for (const [chargeKey, charge] of Object.entries(recurring)) {
      if (!isRecurringCharge(charge)) {
        rejectedCharges.push({
          applicationId: application.id,
          chargeKey,
          reason: MALFORMED_RECURRING_CHARGE_REASON,
        });
        continue;
      }

      declaredCharges.push({
        applicationId: application.id,
        chargeKey,
        charge,
      });
    }
  }

  return { declaredCharges, rejectedCharges };
};
