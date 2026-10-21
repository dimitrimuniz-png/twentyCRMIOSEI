import { Injectable } from '@nestjs/common';

import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { isDefined } from 'twenty-shared/utils';

import { WorkspaceAuditLogEntity } from 'src/engine/core-modules/event-logs/entities/workspace-audit-log.entity';
import { type EventSink } from 'src/engine/core-modules/event-logs/ingest/event-sink';
import { EVENT_LOG_TYPES } from 'src/engine/core-modules/event-logs/registry/event-log-registry';
import { type WorkspaceEventEnvelope } from 'src/engine/core-modules/event-logs/types/workspace-event-envelope.type';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { type WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';

const definitionForTable = (table: WorkspaceEventEnvelope['table']) =>
  Object.values(EVENT_LOG_TYPES).find(
    (definition) => definition.clickHouseTable === table,
  );

@Injectable()
export class PostgresEventSink implements EventSink {
  constructor(
    @InjectWorkspaceScopedRepository(WorkspaceAuditLogEntity)
    private readonly auditLogRepository: WorkspaceScopedRepository<WorkspaceAuditLogEntity>,
  ) {}

  async write(events: WorkspaceEventEnvelope[]): Promise<void> {
    const rowsByWorkspaceId = new Map<
      string,
      QueryDeepPartialEntity<WorkspaceAuditLogEntity>[]
    >();

    for (const event of events) {
      const definition = definitionForTable(event.table);
      const row = event.row as Record<string, unknown>;
      const workspaceId = row.workspaceId;

      if (!isDefined(definition) || typeof workspaceId !== 'string') {
        continue;
      }

      const normalized = definition.normalize(row);
      const occurredAt = new Date(String(row.timestamp ?? ''));
      const rows = rowsByWorkspaceId.get(workspaceId) ?? [];

      rows.push({
        tableName: event.table,
        event: normalized.event,
        userId: normalized.userId ?? null,
        recordId: normalized.recordId ?? null,
        objectMetadataId: normalized.objectMetadataId ?? null,
        // TypeORM's deep partial distributes over jsonb and rejects Record.
        properties: (normalized.properties ?? {}) as QueryDeepPartialEntity<
          WorkspaceAuditLogEntity['properties']
        >,
        payload: row as QueryDeepPartialEntity<
          WorkspaceAuditLogEntity['payload']
        >,
        occurredAt: Number.isNaN(occurredAt.getTime())
          ? new Date()
          : occurredAt,
      });
      rowsByWorkspaceId.set(workspaceId, rows);
    }

    for (const [workspaceId, rows] of rowsByWorkspaceId) {
      await this.auditLogRepository.insert(workspaceId, rows);
    }
  }
}
