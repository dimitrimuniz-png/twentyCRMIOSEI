import { Injectable } from '@nestjs/common';

import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { findFlatEntityByUniversalIdentifierOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier-or-throw.util';
import { ValidationRuleEntity } from 'src/engine/metadata-modules/validation-rule/entities/validation-rule.entity';
import {
  FlatUpdateValidationRuleAction,
  UniversalUpdateValidationRuleAction,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/validation-rule/types/workspace-migration-validation-rule-action.type';
import { WorkspaceMigrationRunnerActionHandler } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/interfaces/workspace-migration-runner-action-handler-service.interface';
import {
  WorkspaceMigrationActionRunnerArgs,
  WorkspaceMigrationActionRunnerContext,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/workspace-migration-action-runner-args.type';
import { resolveUniversalUpdateRelationIdentifiersToIds } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-universal-update-relation-identifiers-to-ids.util';

@Injectable()
export class UpdateValidationRuleActionHandlerService extends WorkspaceMigrationRunnerActionHandler(
  'update',
  'validationRule',
) {
  override async transpileUniversalActionToFlatAction(
    context: WorkspaceMigrationActionRunnerArgs<UniversalUpdateValidationRuleAction>,
  ): Promise<FlatUpdateValidationRuleAction> {
    const { action, allFlatEntityMaps } = context;
    const flatEntity = findFlatEntityByUniversalIdentifierOrThrow({
      flatEntityMaps: allFlatEntityMaps.flatValidationRuleMaps,
      universalIdentifier: action.universalIdentifier,
    });
    const update = resolveUniversalUpdateRelationIdentifiersToIds({
      metadataName: 'validationRule',
      universalUpdate: action.update,
      allFlatEntityMaps,
    });

    return {
      type: 'update',
      metadataName: 'validationRule',
      entityId: flatEntity.id,
      update,
    };
  }

  async executeForMetadata(
    context: WorkspaceMigrationActionRunnerContext<FlatUpdateValidationRuleAction>,
  ): Promise<void> {
    const { flatAction, queryRunner, workspaceId } = context;
    const repository =
      queryRunner.manager.getRepository<ValidationRuleEntity>(
        ValidationRuleEntity,
      );

    await repository.update(
      { id: flatAction.entityId, workspaceId },
      flatAction.update as QueryDeepPartialEntity<ValidationRuleEntity>,
    );
  }

  async executeForWorkspaceSchema(
    _context: WorkspaceMigrationActionRunnerContext<FlatUpdateValidationRuleAction>,
  ): Promise<void> {
    return;
  }
}
