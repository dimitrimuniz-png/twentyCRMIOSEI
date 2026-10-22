import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { ValidationRuleEntity } from 'src/engine/metadata-modules/validation-rule/entities/validation-rule.entity';
import { ValidationRuleToolsFactory } from 'src/engine/metadata-modules/validation-rule/tools/validation-rule-tools.factory';
import { ValidationRuleResolver } from 'src/engine/metadata-modules/validation-rule/validation-rule.resolver';
import { ValidationRuleService } from 'src/engine/metadata-modules/validation-rule/validation-rule.service';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ValidationRuleEntity, WorkspaceEntity]),
    WorkspaceCacheModule,
    PermissionsModule,
  ],
  providers: [
    provideWorkspaceScopedRepository(ValidationRuleEntity),
    ValidationRuleService,
    ValidationRuleResolver,
    ValidationRuleToolsFactory,
  ],
  exports: [ValidationRuleService, ValidationRuleToolsFactory],
})
export class ValidationRuleModule {}
