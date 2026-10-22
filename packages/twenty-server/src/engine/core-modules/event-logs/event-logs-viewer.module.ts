import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClickHouseModule } from 'src/database/clickhouse/clickhouse.module';
import { WorkspaceAuditLogEntity } from 'src/engine/core-modules/event-logs/entities/workspace-audit-log.entity';
import { EventLogsLiveResolver } from 'src/engine/core-modules/event-logs/event-logs-live.resolver';
import { EventLogsResolver } from 'src/engine/core-modules/event-logs/event-logs.resolver';
import { EventLogsService } from 'src/engine/core-modules/event-logs/event-logs.service';
import { EventLogLiveModule } from 'src/engine/core-modules/event-logs/live/event-log-live.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceAuditLogEntity, WorkspaceEntity]),
    PermissionsModule,
    EventLogLiveModule,
    ClickHouseModule,
  ],
  providers: [
    provideWorkspaceScopedRepository(WorkspaceAuditLogEntity),
    EventLogsService,
    EventLogsResolver,
    EventLogsLiveResolver,
  ],
  exports: [EventLogsService],
})
export class EventLogsViewerModule {}
