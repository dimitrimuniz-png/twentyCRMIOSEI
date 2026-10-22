import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';

import {
  FlatCreateRowLevelPermissionPredicateGroupAction,
  UniversalCreateRowLevelPermissionPredicateGroupAction,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/row-level-permission-predicate-group/types/workspace-migration-row-level-permission-predicate-group-action.type';
import { WorkspaceMigrationRunnerActionHandler } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/interfaces/workspace-migration-runner-action-handler-service.interface';
import {
  WorkspaceMigrationActionRunnerArgs,
  WorkspaceMigrationActionRunnerContext,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/workspace-migration-action-runner-args.type';
import { getUniversalFlatEntityEmptyForeignKeyAggregators } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/reset-universal-flat-entity-foreign-key-aggregators.util';
import { resolveUniversalRelationIdentifiersToIds } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-universal-relation-identifiers-to-ids.util';

@Injectable()
export class CreateRowLevelPermissionPredicateGroupActionHandlerService extends WorkspaceMigrationRunnerActionHandler(
  'create',
  'rowLevelPermissionPredicateGroup',
) {
  override async transpileUniversalActionToFlatAction({
    action,
    allFlatEntityMaps,
    flatApplication,
    workspaceId,
  }: WorkspaceMigrationActionRunnerArgs<UniversalCreateRowLevelPermissionPredicateGroupAction>): Promise<FlatCreateRowLevelPermissionPredicateGroupAction> {
    const resolvedIds = resolveUniversalRelationIdentifiersToIds({
      flatEntityMaps: allFlatEntityMaps,
      metadataName: action.metadataName,
      universalForeignKeyValues: action.flatEntity,
    });
    // The stored action drops inverse id lists. A later child or predicate
    // looks them up with hasOwnProperty, so they have to exist empty.
    const emptyUniversalForeignKeyAggregators =
      getUniversalFlatEntityEmptyForeignKeyAggregators({
        metadataName: 'rowLevelPermissionPredicateGroup',
      });

    return {
      ...action,
      flatEntity: {
        ...action.flatEntity,
        ...resolvedIds,
        applicationId: flatApplication.id,
        id: action.id ?? v4(),
        workspaceId,
        childRowLevelPermissionPredicateGroupIds: [],
        rowLevelPermissionPredicateIds: [],
        ...emptyUniversalForeignKeyAggregators,
      },
    };
  }

  async executeForMetadata(
    context: WorkspaceMigrationActionRunnerContext<FlatCreateRowLevelPermissionPredicateGroupAction>,
  ): Promise<void> {
    await this.insertFlatEntitiesInRepository({
      queryRunner: context.queryRunner,
      flatEntities: [context.flatAction.flatEntity],
    });
  }

  async executeForWorkspaceSchema(
    _context: WorkspaceMigrationActionRunnerContext<FlatCreateRowLevelPermissionPredicateGroupAction>,
  ): Promise<void> {
    return;
  }
}
