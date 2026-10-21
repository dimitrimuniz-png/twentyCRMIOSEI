import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.51.0', 1792581116000)
export class AddSsoIdentityProviderTableFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "core"."ssoIdentityProvider" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'Active',
        "issuer" character varying NOT NULL,
        "certificate" text,
        "ssoUrl" character varying,
        "clientId" character varying,
        "clientSecret" text,
        "workspaceId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sso_identity_provider" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_SSO_IDENTITY_PROVIDER_WORKSPACE_ID" ON "core"."ssoIdentityProvider" ("workspaceId")',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."ssoIdentityProvider" ADD CONSTRAINT "FK_sso_identity_provider_workspace" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."ssoIdentityProvider" DROP CONSTRAINT "FK_sso_identity_provider_workspace"',
    );
    await queryRunner.query(
      'DROP INDEX "core"."IDX_SSO_IDENTITY_PROVIDER_WORKSPACE_ID"',
    );
    await queryRunner.query('DROP TABLE "core"."ssoIdentityProvider"');
  }
}
