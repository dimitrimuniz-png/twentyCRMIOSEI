import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';

import { WorkspaceAuditLogEntity } from 'src/engine/core-modules/event-logs/entities/workspace-audit-log.entity';
import { type EventSink } from 'src/engine/core-modules/event-logs/ingest/event-sink';
import { EVENT_LOG_TYPES } from 'src/engine/core-modules/event-logs/registry/event-log-registry';
import { type WorkspaceEventEnvelope } from 'src/engine/core-modules/event-logs/types/workspace-event-envelope.type';

const definitionForTable = (table: WorkspaceEventEnvelope['table']) =>
  Object.values(EVENT_LOG_TYPES).find(
    (definition) => definition.clickHouseTable === table,
  );

@Injectable()
export class PostgresEventSink implements EventSink {
  constructor(
    @InjectRepository(WorkspaceAuditLogEntity)
    private readonly auditLogRepository: Repository<WorkspaceAuditLogEntity>,
  ) {}

  async write(events: WorkspaceEventEnvelope[]): Promise<void> {
    const rows = events.flatMap((event) => {
      const definition = definitionForTable(event.table);
      const row = event.row as Record<string, unknown>;
      const workspaceId = row.workspaceId;

      if (!isDefined(definition) || typeof workspaceId !== 'string') {
        return [];
      }

      const normalized = definition.normalize(row);
      const occurredAt = new Date(String(row.timestamp ?? ''));

      return [
        this.auditLogRepository.create({
          workspaceId,
          tableName: event.table,
          event: normalized.event,
          userId: normalized.userId ?? null,
          recordId: normalized.recordId ?? null,
          objectMetadataId: normalized.objectMetadataId ?? null,
          properties: normalized.properties ?? {},
          payload: row,
          occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
        }),
      ];
    });

    if (rows.length === 0) {
      return;
    }

    await this.auditLogRepository.save(rows);
  }
}
