import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { LessThan, type Repository } from 'typeorm';
import { EventLogTable } from 'twenty-shared/types';

import { ClickHouseService } from 'src/database/clickhouse/clickhouse.service';
import { formatDateTimeForClickHouse } from 'src/database/clickhouse/utils/format-date-time-for-clickhouse.util';
import { WorkspaceAuditLogEntity } from 'src/engine/core-modules/event-logs/entities/workspace-audit-log.entity';
import { type EventLogQueryInput } from 'src/engine/core-modules/event-logs/dtos/event-log-query.input';
import { type EventLogQueryResult } from 'src/engine/core-modules/event-logs/dtos/event-log-result.dto';
import {
  EVENT_LOG_TYPES,
  getClickHouseTableName,
} from 'src/engine/core-modules/event-logs/registry/event-log-registry';
import { isEventLogRowMatchingFieldFilters } from 'src/engine/core-modules/event-logs/utils/is-event-log-row-matching-field-filters.util';
import { buildEventLogFieldFilterCondition } from 'src/engine/core-modules/event-logs/utils/build-event-log-field-filter-condition.util';
import { normalizeEventLogRecords } from 'src/engine/core-modules/event-logs/utils/normalize-event-log-records';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { type WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';

const decodeOffset = (after?: string): number => {
  if (!after) {
    return 0;
  }

  const parsed = Number(Buffer.from(after, 'base64').toString('utf8'));

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

@Injectable()
export class EventLogsService {
  constructor(
    @InjectWorkspaceScopedRepository(WorkspaceAuditLogEntity)
    private readonly auditLogRepository: WorkspaceScopedRepository<WorkspaceAuditLogEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @Optional()
    private readonly clickHouseService?: ClickHouseService,
  ) {}

  // Audit history in this fork is stored in Postgres and is not entitlement-gated.
  async validateAccess(
    _workspaceId: string,
    _table: EventLogTable,
  ): Promise<void> {
    return;
  }

  async query({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: EventLogQueryInput;
  }): Promise<EventLogQueryResult> {
    if (this.clickHouseService?.getMainClient()) {
      return this.queryClickHouse({ workspaceId, input });
    }

    const first = input.first ?? 100;
    const offset = decodeOffset(input.after);
    const filters = input.filters;
    const queryBuilder = this.auditLogRepository
      .createScopedQueryBuilder(workspaceId, 'auditLog')
      .andWhere('auditLog.tableName = :tableName', {
        tableName: getClickHouseTableName(input.table),
      });

    if (filters?.eventType) {
      queryBuilder.andWhere('auditLog.event = :event', {
        event: filters.eventType,
      });
    }

    if (filters?.userWorkspaceId) {
      queryBuilder.andWhere('auditLog.userId = :userId', {
        userId: filters.userWorkspaceId,
      });
    }

    if (filters?.recordId) {
      queryBuilder.andWhere('auditLog.recordId = :recordId', {
        recordId: filters.recordId,
      });
    }

    if (filters?.objectMetadataId) {
      queryBuilder.andWhere('auditLog.objectMetadataId = :objectMetadataId', {
        objectMetadataId: filters.objectMetadataId,
      });
    }

    if (filters?.dateRange?.start) {
      queryBuilder.andWhere('auditLog.occurredAt >= :start', {
        start: filters.dateRange.start,
      });
    }

    if (filters?.dateRange?.end) {
      queryBuilder.andWhere('auditLog.occurredAt <= :end', {
        end: filters.dateRange.end,
      });
    }

    const rows = await queryBuilder
      .orderBy('auditLog.occurredAt', 'DESC')
      .addOrderBy('auditLog.id', 'DESC')
      .getMany();
    const matchingRows = rows.filter((row) =>
      isEventLogRowMatchingFieldFilters({
        row: row.payload,
        fieldFilters: filters?.fieldFilters ?? [],
      }),
    );
    const page = matchingRows.slice(offset, offset + first);
    const hasNextPage = offset + first < matchingRows.length;

    return {
      records: page.map((row) => ({
        event: row.event,
        timestamp: row.occurredAt,
        userId: row.userId ?? undefined,
        properties: row.properties,
        recordId: row.recordId ?? undefined,
        objectMetadataId: row.objectMetadataId ?? undefined,
      })),
      totalCount: matchingRows.length,
      pageInfo: {
        hasNextPage,
        endCursor: hasNextPage
          ? Buffer.from(String(offset + first)).toString('base64')
          : undefined,
      },
    };
  }

  private async queryClickHouse({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: EventLogQueryInput;
  }): Promise<EventLogQueryResult> {
    const definition = EVENT_LOG_TYPES[input.table];
    const first = input.first ?? 100;
    const offset = decodeOffset(input.after);
    const filters = input.filters;
    const conditions = ['workspaceId = {workspaceId:String}'];
    const params: Record<string, unknown> = { workspaceId };

    if (filters?.eventType) {
      conditions.push(
        `positionCaseInsensitive(${definition.eventFieldName}, {eventType:String}) > 0`,
      );
      params.eventType = filters.eventType;
    }

    if (filters?.userWorkspaceId) {
      const userColumn =
        input.table === EventLogTable.USAGE_EVENT
          ? 'userWorkspaceId'
          : 'userId';

      conditions.push(`${userColumn} = {userWorkspaceId:String}`);
      params.userWorkspaceId = filters.userWorkspaceId;
    }

    if (filters?.recordId) {
      conditions.push('recordId = {recordId:String}');
      params.recordId = filters.recordId;
    }

    if (filters?.objectMetadataId) {
      conditions.push('objectMetadataId = {objectMetadataId:String}');
      params.objectMetadataId = filters.objectMetadataId;
    }

    if (filters?.dateRange?.start) {
      conditions.push('timestamp >= {rangeStart:String}');
      params.rangeStart = formatDateTimeForClickHouse(filters.dateRange.start);
    }

    if (filters?.dateRange?.end) {
      conditions.push('timestamp <= {rangeEnd:String}');
      params.rangeEnd = formatDateTimeForClickHouse(filters.dateRange.end);
    }

    filters?.fieldFilters?.forEach((fieldFilter, index) => {
      const parameterName = `fieldFilter${index}`;

      conditions.push(
        buildEventLogFieldFilterCondition({
          fieldFilter,
          parameterName,
          table: input.table,
        }),
      );
      params[parameterName] = fieldFilter.values;
    });

    const where = conditions.join(' AND ');
    const tableName = definition.clickHouseTable;
    const [rows, counts] = await Promise.all([
      this.clickHouseService!.selectOrThrow<Record<string, unknown>>(
        `SELECT * FROM ${tableName} WHERE ${where} ORDER BY timestamp DESC LIMIT {limit:UInt32} OFFSET {offset:UInt32}`,
        { ...params, limit: first, offset },
      ),
      this.clickHouseService!.selectOrThrow<{ totalCount: string }>(
        `SELECT count() AS totalCount FROM ${tableName} WHERE ${where}`,
        params,
      ),
    ]);
    const totalCount = Number(counts[0]?.totalCount ?? 0);

    return {
      records: normalizeEventLogRecords(rows, input.table),
      totalCount,
      pageInfo: {
        hasNextPage: offset + rows.length < totalCount,
        endCursor:
          offset + rows.length < totalCount
            ? Buffer.from(String(offset + rows.length)).toString('base64')
            : undefined,
      },
    };
  }

  async deleteExpired(): Promise<number> {
    const workspaces = await this.workspaceRepository.find({
      select: { id: true, eventLogRetentionDays: true },
    });
    let deletedCount = 0;

    for (const workspace of workspaces) {
      const cutoff = new Date(
        Date.now() - workspace.eventLogRetentionDays * 24 * 60 * 60 * 1000,
      );
      const result = await this.auditLogRepository.delete(workspace.id, {
        occurredAt: LessThan(cutoff),
      });

      deletedCount += result.affected ?? 0;
    }

    return deletedCount;
  }
}
