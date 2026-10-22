import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { RowLevelPermissionPredicateGroupEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate-group.entity';
import { RowLevelPermissionPredicateEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate.entity';
import { RowLevelPermissionPredicateGroupService } from 'src/engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate-group.service';
import { RowLevelPermissionPredicateService } from 'src/engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate.service';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RowLevelPermissionPredicateEntity,
      RowLevelPermissionPredicateGroupEntity,
      WorkspaceEntity,
      FieldMetadataEntity,
    ]),
    WorkspaceCacheModule,
  ],
  providers: [
    provideWorkspaceScopedRepository(RowLevelPermissionPredicateEntity),
    provideWorkspaceScopedRepository(RowLevelPermissionPredicateGroupEntity),
    RowLevelPermissionPredicateService,
    RowLevelPermissionPredicateGroupService,
  ],
  exports: [
    RowLevelPermissionPredicateService,
    RowLevelPermissionPredicateGroupService,
  ],
})
export class RowLevelPermissionModule {}
