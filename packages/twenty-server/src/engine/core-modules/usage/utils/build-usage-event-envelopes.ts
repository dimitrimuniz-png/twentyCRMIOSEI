import { formatDateTimeForClickHouse } from 'src/database/clickhouse/utils/format-date-time-for-clickhouse.util';
import { type UsageEventRow } from 'src/engine/core-modules/event-logs/types/workspace-event-envelope.type';
import { type UsageEvent } from 'src/engine/core-modules/usage/types/usage-event.type';

const blank = (value: string | null | undefined): string => value ?? '';

export const buildUsageEventEnvelopes = (
  workspaceId: string,
  events: UsageEvent[],
): Array<{ table: 'usageEvent'; row: UsageEventRow }> =>
  events.map((event) => {
    const spenders = event.spenders ?? {};
    const row = {
      timestamp: formatDateTimeForClickHouse(new Date()),
      workspaceId,
      userWorkspaceId: blank(spenders.userWorkspaceId),
      apiKeyId: blank(spenders.apiKeyId),
      applicationId: blank(spenders.applicationId),
      agentId: blank(spenders.agentId),
      workflowId: blank(spenders.workflowId),
      logicFunctionId: blank(spenders.logicFunctionId),
      resourceType: event.resourceType,
      operationType: event.operationType,
      quantity: event.quantity,
      unit: event.unit,
      creditsUsedMicro: event.creditsUsedMicro ?? 0,
      userCreditsUsedMicro: event.userCreditsUsedMicro ?? 0,
      resourceId: blank(event.resourceId),
      resourceContext: blank(event.resourceContext),
      metadata: {},
      ...(event.periodStart
        ? { periodStart: formatDateTimeForClickHouse(event.periodStart) }
        : {}),
    };

    return { table: 'usageEvent' as const, row: row as UsageEventRow };
  });
