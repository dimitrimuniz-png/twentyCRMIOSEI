import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { ValidationRuleEntity } from 'src/engine/metadata-modules/validation-rule/entities/validation-rule.entity';
import { ValidationRuleResolver } from 'src/engine/metadata-modules/validation-rule/validation-rule.resolver';
import { ValidationRuleService } from 'src/engine/metadata-modules/validation-rule/validation-rule.service';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ValidationRuleEntity, WorkspaceEntity]),
    WorkspaceCacheModule,
  ],
  providers: [ValidationRuleService, ValidationRuleResolver],
  exports: [ValidationRuleService],
})
export class ValidationRuleModule {}
