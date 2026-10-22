import { type UsageConsumptionRow } from 'src/engine/core-modules/usage/types/usage-consumption-row.type';
import { type RecordUsageInput } from 'src/engine/core-modules/usage/types/record-usage-input.type';
import { isValidCreditAmountMicro } from 'src/engine/core-modules/usage/utils/is-valid-credit-amount-micro.util';

const blank = (value: string | null | undefined): string =>
  value == null || value.length === 0 ? '' : value;

const creditAmount = (value: number | undefined): number =>
  isValidCreditAmountMicro(value ?? Number.NaN) ? (value as number) : 0;

export const fromRecordUsageInputToUsageConsumptionRow = (
  event: RecordUsageInput,
): UsageConsumptionRow => {
  const creditsUsedMicro = creditAmount(event.creditsUsedMicro);
  const userCreditsUsedMicro = creditAmount(event.userCreditsUsedMicro);
  const spenders = event.spenders ?? {};

  return {
    operationType: event.operationType,
    unit: event.unit,
    userWorkspaceId: blank(spenders.userWorkspaceId),
    apiKeyId: blank(spenders.apiKeyId),
    applicationId: blank(spenders.applicationId),
    agentId: blank(spenders.agentId),
    workflowId: blank(spenders.workflowId),
    logicFunctionId: blank(spenders.logicFunctionId),
    creditsUsedMicro,
    userCreditsUsedMicro,
    workspaceCreditsUsedMicro: creditsUsedMicro - userCreditsUsedMicro,
    quantity: event.quantity ?? 0,
  };
};
