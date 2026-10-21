import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceAuditLogEntity } from 'src/engine/core-modules/event-logs/entities/workspace-audit-log.entity';
import { EventLogsResolver } from 'src/engine/core-modules/event-logs/event-logs.resolver';
import { EventLogsService } from 'src/engine/core-modules/event-logs/event-logs.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceAuditLogEntity, WorkspaceEntity]),
  ],
  providers: [EventLogsService, EventLogsResolver],
  exports: [EventLogsService],
})
export class EventLogsViewerModule {}
