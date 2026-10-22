import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { ClickHouseService } from 'src/database/clickhouse/clickhouse.service';
import { formatDateTimeForClickHouse } from 'src/database/clickhouse/utils/format-date-time-for-clickhouse.util';
import { USAGE_SPENDER_COLUMN_BY_SPENDER_TYPE } from 'src/engine/core-modules/usage-limit/constants/usage-spender-column-by-spender-type.constant';
import { type SpenderType } from 'src/engine/core-modules/usage-limit/types/spender-type.type';
import { type CreditUsedItemDTO } from 'src/engine/core-modules/usage/dtos/credit-used-item.dto';
import { type UsageBreakdownItemDTO } from 'src/engine/core-modules/usage/dtos/usage-breakdown-item.dto';
import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import { UsageResourceType } from 'src/engine/core-modules/usage/enums/usage-resource-type.enum';
import { type UsageConsumptionRow } from 'src/engine/core-modules/usage/types/usage-consumption-row.type';
import { type UsagePeriodAnchor } from 'src/engine/core-modules/usage/types/usage-period-anchor.type';
import { buildUsagePeriodClause } from 'src/engine/core-modules/usage/utils/build-usage-period-clause.util';

export type UsageApplicationBreakdownItem = {
  applicationId: string;
  operation: string;
  creditsUsed: number;
  userCreditsUsed: number;
  workspaceCreditsUsed: number;
};

export type UsageBreakdownItem = {
  key: string;
  label: string;
  creditsUsed: number;
  userCreditsUsed: number;
  workspaceCreditsUsed: number;
};

export type UsageTimeSeriesPoint = {
  date: string;
  creditsUsed: number;
  workspaceCreditsUsed?: number;
};

const KNOWN_RESOURCE_TYPES = new Set<string>(Object.values(UsageResourceType));
const KNOWN_OPERATION_TYPES = new Set<string>(
  Object.values(UsageOperationType),
);

const EMPTY_CONSUMPTION_TOTALS: Pick<
  UsageConsumptionRow,
  | 'unit'
  | 'creditsUsedMicro'
  | 'userCreditsUsedMicro'
  | 'workspaceCreditsUsedMicro'
  | 'quantity'
> = {
  unit: '',
  creditsUsedMicro: 0,
  userCreditsUsedMicro: 0,
  workspaceCreditsUsedMicro: 0,
  quantity: 0,
};

type InstallationCreditRow = {
  resourceType: string;
  operationType: string;
  creditsUsedMicro: string | number;
};

@Injectable()
export class UsageAnalyticsService {
  constructor(private readonly clickHouseService: ClickHouseService) {}

  async getCreditsUsedBreakdownForInstallations({
    installations,
    periodStart,
    periodEnd,
  }: {
    installations: Array<{ applicationId: string; workspaceId: string }>;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<CreditUsedItemDTO[]> {
    if (installations.length === 0) {
      return [];
    }

    const rows =
      await this.clickHouseService.selectOrThrow<InstallationCreditRow>(
        `SELECT
           resourceType,
           operationType,
           sum(creditsUsedMicro) AS creditsUsedMicro
         FROM usageEvent
         WHERE timestamp >= {periodStart:DateTime64(3)}
           AND timestamp < {periodEnd:DateTime64(3)}
           AND concat(applicationId, ':', workspaceId) IN {installationKeys:Array(String)}
         GROUP BY resourceType, operationType
         SETTINGS use_query_cache = 1, query_cache_min_query_duration = 0, query_cache_min_query_runs = 0`,
        {
          periodStart: formatClickHouseDateTime(periodStart),
          periodEnd: formatClickHouseDateTime(periodEnd),
          installationKeys: installations.map(
            (installation) =>
              `${installation.applicationId}:${installation.workspaceId}`,
          ),
        },
      );

    return rows
      .map((row) => toCreditUsedItem(row))
      .sort((left, right) => right.creditsUsed - left.creditsUsed);
  }

  async getAdminAiUsageByWorkspace(_args: {
    periodStart: Date;
    periodEnd: Date;
    useDollarMode: boolean;
  }): Promise<UsageBreakdownItemDTO[]> {
    return [];
  }

  async getCreditsUsedMicroForBillingPeriod(_args: {
    workspaceId: string;
    periodStart: Date;
  }): Promise<{ workspaceCreditsUsedMicro: number }> {
    return { workspaceCreditsUsedMicro: 0 };
  }

  async getConsumptionRowsForAllScopes({
    workspaceId,
    resourceType,
    periodStart,
    periodEnd,
    periodAnchor,
  }: {
    workspaceId: string;
    resourceType: string;
    periodStart: Date;
    periodEnd: Date;
    periodAnchor: string;
  }): Promise<UsageConsumptionRow[]> {
    const rows =
      await this.clickHouseService.selectOrThrow<ConsumptionAggregateRow>(
        `SELECT
         operationType,
         unit,
         userWorkspaceId,
         apiKeyId,
         applicationId,
         agentId,
         workflowId,
         logicFunctionId,
         sum(creditsUsedMicro) AS creditsUsedMicroSum,
         sum(userCreditsUsedMicro) AS userCreditsUsedMicroSum,
         sum(quantity) AS quantitySum
       FROM usageEvent
       WHERE workspaceId = {workspaceId:String}
         AND resourceType = {resourceType:String}
         ${buildUsagePeriodClause(asPeriodAnchor(periodAnchor))}
       GROUP BY
         operationType,
         unit,
         userWorkspaceId,
         apiKeyId,
         applicationId,
         agentId,
         workflowId,
         logicFunctionId`,
        {
          workspaceId,
          resourceType,
          ...periodParams(periodStart, periodEnd),
        },
      );

    return rows.map(toConsumptionRow);
  }

  async getConsumptionTotalsForScope({
    workspaceId,
    resourceType,
    operationType,
    unit,
    spenderType,
    spenderId,
    periodStart,
    periodEnd,
    periodAnchor,
  }: {
    workspaceId: string;
    resourceType: string;
    operationType: string;
    unit: string | null;
    spenderType: string | null;
    spenderId: string | null;
    periodStart: Date;
    periodEnd: Date;
    periodAnchor: string;
  }): Promise<typeof EMPTY_CONSUMPTION_TOTALS> {
    const spender = spenderPredicate(spenderType, spenderId);
    const [row] =
      await this.clickHouseService.selectOrThrow<ConsumptionAggregateRow>(
        `SELECT
         sum(creditsUsedMicro) AS creditsUsedMicroSum,
         sum(userCreditsUsedMicro) AS userCreditsUsedMicroSum,
         sum(quantity) AS quantitySum
       FROM usageEvent
       WHERE workspaceId = {workspaceId:String}
         AND resourceType = {resourceType:String}
         ${operationType === UsageOperationType.ALL ? '' : 'AND operationType = {operationType:String}'}
         ${isDefined(unit) ? 'AND unit = {unit:String}' : ''}
         ${spender.sql}
         ${buildUsagePeriodClause(asPeriodAnchor(periodAnchor))}`,
        {
          workspaceId,
          resourceType,
          operationType,
          ...(isDefined(unit) ? { unit } : {}),
          ...spender.params,
          ...periodParams(periodStart, periodEnd),
        },
      );

    return {
      ...toConsumptionRow(row),
      unit: unit ?? '',
    };
  }
}

type ConsumptionAggregateRow = {
  operationType?: string;
  unit?: string;
  userWorkspaceId?: string;
  apiKeyId?: string;
  applicationId?: string;
  agentId?: string;
  workflowId?: string;
  logicFunctionId?: string;
  creditsUsedMicroSum?: string | number | null;
  userCreditsUsedMicroSum?: string | number | null;
  quantitySum?: string | number | null;
};

const toConsumptionRow = (
  row: ConsumptionAggregateRow | undefined,
): UsageConsumptionRow => {
  const creditsUsedMicro = Number(row?.creditsUsedMicroSum ?? 0);
  const userCreditsUsedMicro = Number(row?.userCreditsUsedMicroSum ?? 0);

  return {
    operationType: row?.operationType ?? '',
    unit: row?.unit ?? '',
    userWorkspaceId: row?.userWorkspaceId ?? '',
    apiKeyId: row?.apiKeyId ?? '',
    applicationId: row?.applicationId ?? '',
    agentId: row?.agentId ?? '',
    workflowId: row?.workflowId ?? '',
    logicFunctionId: row?.logicFunctionId ?? '',
    creditsUsedMicro,
    userCreditsUsedMicro,
    workspaceCreditsUsedMicro: creditsUsedMicro - userCreditsUsedMicro,
    quantity: Number(row?.quantitySum ?? 0),
  };
};

const toCreditUsedItem = (row: InstallationCreditRow): CreditUsedItemDTO => {
  const creditsUsed = Number(row.creditsUsedMicro) / 1_000_000;
  const resource = asKnownResourceType(row.resourceType);
  const operation = asKnownOperationType(row.operationType);

  if (resource === null || operation === null) {
    return {
      label: row.operationType,
      resource: null,
      operation: null,
      creditsUsed,
    };
  }

  return {
    label: null,
    resource,
    operation,
    creditsUsed,
  };
};

const asKnownResourceType = (value: string): UsageResourceType | null =>
  KNOWN_RESOURCE_TYPES.has(value) && value !== UsageResourceType.ALL
    ? (value as UsageResourceType)
    : null;

const asKnownOperationType = (value: string): UsageOperationType | null =>
  KNOWN_OPERATION_TYPES.has(value) && value !== UsageOperationType.ALL
    ? (value as UsageOperationType)
    : null;

const formatClickHouseDateTime = (date: Date): string =>
  formatDateTimeForClickHouse(date);

const asPeriodAnchor = (periodAnchor: string): UsagePeriodAnchor =>
  periodAnchor === 'billing' ? 'billing' : 'calendar';

const periodParams = (periodStart: Date, periodEnd: Date) => ({
  periodStart: formatDateTimeForClickHouse(periodStart),
  periodEnd: formatDateTimeForClickHouse(periodEnd),
});

const spenderPredicate = (
  spenderType: string | null,
  spenderId: string | null,
): { sql: string; params: { spenderId?: string } } => {
  if (!isDefined(spenderType) || spenderType === 'workspace') {
    return { sql: '', params: {} };
  }

  const column =
    USAGE_SPENDER_COLUMN_BY_SPENDER_TYPE[
      spenderType as Exclude<SpenderType, 'workspace'>
    ];

  if (!isDefined(column)) {
    return { sql: '', params: {} };
  }

  if (!isDefined(spenderId)) {
    return { sql: `AND ${column} != ''`, params: {} };
  }

  return {
    sql: `AND ${column} = {spenderId:String}`,
    params: { spenderId },
  };
};
