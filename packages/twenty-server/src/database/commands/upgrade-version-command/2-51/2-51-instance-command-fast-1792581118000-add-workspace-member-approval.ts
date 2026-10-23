import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.51.0', 1792581118000)
export class AddWorkspaceMemberApprovalFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."workspace"
      ADD COLUMN "isMemberApprovalRequired" boolean NOT NULL DEFAULT true
    `);
    // Existing rows stay approved. New rows omit the column only when application
    // code does not set it; self-serve joins set PENDING explicitly.
    await queryRunner.query(`
      ALTER TABLE "core"."userWorkspace"
      ADD COLUMN "approvalStatus" character varying NOT NULL DEFAULT 'APPROVED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "core"."userWorkspace" DROP COLUMN "approvalStatus"
    `);
    await queryRunner.query(`
      ALTER TABLE "core"."workspace" DROP COLUMN "isMemberApprovalRequired"
    `);
  }
}
