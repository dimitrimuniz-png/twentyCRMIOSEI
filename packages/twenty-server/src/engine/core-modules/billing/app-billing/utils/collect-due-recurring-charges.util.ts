import { type DeclaredRecurringCharge } from 'src/engine/core-modules/billing/app-billing/utils/collect-declared-recurring-charges.util';
import { buildRecurringChargeKey } from 'src/engine/core-modules/usage/utils/build-recurring-charge-key.util';

export const collectDueRecurringCharges = ({
  declaredCharges,
  alreadyChargedKeys,
}: {
  declaredCharges: DeclaredRecurringCharge[];
  alreadyChargedKeys: ReadonlySet<string>;
}): DeclaredRecurringCharge[] =>
  declaredCharges.filter(
    (declaredCharge) =>
      !alreadyChargedKeys.has(
        buildRecurringChargeKey({
          applicationId: declaredCharge.applicationId,
          chargeKey: declaredCharge.chargeKey,
        }),
      ),
  );
