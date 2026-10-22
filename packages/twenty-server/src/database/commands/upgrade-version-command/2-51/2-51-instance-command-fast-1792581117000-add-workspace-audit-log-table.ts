import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.51.0', 1792581117000)
export class AddWorkspaceAuditLogTableFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."workspaceAuditLog" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId" uuid NOT NULL,
        "tableName" character varying NOT NULL,
        "event" character varying NOT NULL,
        "userId" character varying,
        "recordId" uuid,
        "objectMetadataId" uuid,
        "properties" jsonb NOT NULL DEFAULT '{}',
        "payload" jsonb NOT NULL DEFAULT '{}',
        "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_audit_log" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_WORKSPACE_AUDIT_LOG_WORKSPACE_TABLE_OCCURRED_AT" ON "core"."workspaceAuditLog" ("workspaceId", "tableName", "occurredAt")',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."workspaceAuditLog" ADD CONSTRAINT "FK_workspace_audit_log_workspace" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."workspaceAuditLog" DROP CONSTRAINT "FK_workspace_audit_log_workspace"',
    );
    await queryRunner.query(
      'DROP INDEX "core"."IDX_WORKSPACE_AUDIT_LOG_WORKSPACE_TABLE_OCCURRED_AT"',
    );
    await queryRunner.query('DROP TABLE "core"."workspaceAuditLog"');
  }
}
