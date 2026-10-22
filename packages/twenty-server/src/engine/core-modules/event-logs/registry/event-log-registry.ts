import { EventLogTable } from 'twenty-shared/types';

import { BillingEntitlementKey } from 'src/engine/core-modules/billing/enums/billing-entitlement-key.enum';
import { type EventLogRecord } from 'src/engine/core-modules/event-logs/dtos/event-log-result.dto';

type EventLogRow = Record<string, unknown>;

type NormalizedEventLog = Omit<EventLogRecord, 'timestamp'> & {
  timestamp?: Date;
};

export type EventLogTypeDefinition = {
  clickHouseTable: string;
  eventFieldName: string;
  requiresEntitlement: BillingEntitlementKey | null;
  normalize: (row: EventLogRow) => NormalizedEventLog;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const EVENT_LOG_TYPES: Record<EventLogTable, EventLogTypeDefinition> = {
  [EventLogTable.WORKSPACE_EVENT]: {
    clickHouseTable: 'workspaceEvent',
    eventFieldName: 'event',
    requiresEntitlement: BillingEntitlementKey.AUDIT_LOGS,
    normalize: (row) => ({
      event: String(row.event ?? ''),
      userId: row.userId as string | undefined,
      properties: asRecord(row.properties),
    }),
  },
  [EventLogTable.PAGEVIEW]: {
    clickHouseTable: 'pageview',
    eventFieldName: 'name',
    requiresEntitlement: BillingEntitlementKey.AUDIT_LOGS,
    normalize: (row) => ({
      event: String(row.name ?? ''),
      userId: row.userId as string | undefined,
      properties: asRecord(row.properties),
    }),
  },
  [EventLogTable.OBJECT_EVENT]: {
    clickHouseTable: 'objectEvent',
    eventFieldName: 'event',
    requiresEntitlement: BillingEntitlementKey.AUDIT_LOGS,
    normalize: (row) => ({
      event: String(row.event ?? ''),
      userId: row.userId as string | undefined,
      recordId: row.recordId as string | undefined,
      objectMetadataId: row.objectMetadataId as string | undefined,
      isCustom:
        row.isCustom === true || row.isCustom === 1 || row.isCustom === '1',
      properties: asRecord(row.properties),
    }),
  },
  [EventLogTable.USAGE_EVENT]: {
    clickHouseTable: 'usageEvent',
    eventFieldName: 'resourceType',
    requiresEntitlement: BillingEntitlementKey.USAGE_LIMIT,
    normalize: (row) => ({
      event: String(row.resourceType ?? ''),
      userId: row.userWorkspaceId as string | undefined,
      properties: {
        operationType: row.operationType,
        quantity: row.quantity,
        unit: row.unit,
        creditsUsedMicro: row.creditsUsedMicro,
        resourceId: row.resourceId,
        resourceContext: row.resourceContext,
        ...asRecord(row.metadata),
      },
    }),
  },
  [EventLogTable.APPLICATION_LOG]: {
    clickHouseTable: 'applicationLog',
    eventFieldName: 'logicFunctionName',
    requiresEntitlement: null,
    normalize: (row) => ({
      event: String(row.logicFunctionName ?? ''),
      properties: {
        level: row.level,
        message: row.message,
        executionId: row.executionId,
        applicationId: row.applicationId,
        logicFunctionId: row.logicFunctionId,
      },
    }),
  },
};

export const getClickHouseTableName = (table: EventLogTable): string =>
  EVENT_LOG_TYPES[table].clickHouseTable;

export const EVENT_LOG_FILTERABLE_FIELDS: Record<
  EventLogTable,
  ReadonlySet<string>
> = {
  [EventLogTable.WORKSPACE_EVENT]: new Set(['event', 'userId', 'workspaceId']),
  [EventLogTable.PAGEVIEW]: new Set(['name', 'userId', 'workspaceId']),
  [EventLogTable.OBJECT_EVENT]: new Set([
    'event',
    'userId',
    'recordId',
    'objectMetadataId',
    'workspaceId',
  ]),
  [EventLogTable.USAGE_EVENT]: new Set([
    'resourceType',
    'userWorkspaceId',
    'userId',
    'workspaceId',
  ]),
  [EventLogTable.APPLICATION_LOG]: new Set([
    'level',
    'message',
    'logicFunctionName',
    'workspaceId',
  ]),
};
