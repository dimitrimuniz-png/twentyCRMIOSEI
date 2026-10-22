import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';

import {
  FlatCreateValidationRuleAction,
  UniversalCreateValidationRuleAction,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/validation-rule/types/workspace-migration-validation-rule-action.type';
import { WorkspaceMigrationRunnerActionHandler } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/interfaces/workspace-migration-runner-action-handler-service.interface';
import {
  WorkspaceMigrationActionRunnerArgs,
  WorkspaceMigrationActionRunnerContext,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/workspace-migration-action-runner-args.type';
import { resolveUniversalRelationIdentifiersToIds } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-universal-relation-identifiers-to-ids.util';

@Injectable()
export class CreateValidationRuleActionHandlerService extends WorkspaceMigrationRunnerActionHandler(
  'create',
  'validationRule',
) {
  override async transpileUniversalActionToFlatAction({
    action,
    allFlatEntityMaps,
    flatApplication,
    workspaceId,
  }: WorkspaceMigrationActionRunnerArgs<UniversalCreateValidationRuleAction>): Promise<FlatCreateValidationRuleAction> {
    const resolvedIds = resolveUniversalRelationIdentifiersToIds({
      flatEntityMaps: allFlatEntityMaps,
      metadataName: action.metadataName,
      universalForeignKeyValues: action.flatEntity,
    });

    return {
      ...action,
      flatEntity: {
        ...action.flatEntity,
        ...resolvedIds,
        applicationId: flatApplication.id,
        id: action.id ?? v4(),
        workspaceId,
      },
    };
  }

  async executeForMetadata(
    context: WorkspaceMigrationActionRunnerContext<FlatCreateValidationRuleAction>,
  ): Promise<void> {
    await this.insertFlatEntitiesInRepository({
      queryRunner: context.queryRunner,
      flatEntities: [context.flatAction.flatEntity],
    });
  }

  async executeForWorkspaceSchema(
    _context: WorkspaceMigrationActionRunnerContext<FlatCreateValidationRuleAction>,
  ): Promise<void> {
    return;
  }
}
