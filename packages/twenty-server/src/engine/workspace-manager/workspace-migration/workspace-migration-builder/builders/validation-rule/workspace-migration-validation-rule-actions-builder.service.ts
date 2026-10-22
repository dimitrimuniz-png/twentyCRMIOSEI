import { Injectable } from '@nestjs/common';

import { ALL_METADATA_NAME } from 'twenty-shared/metadata';

import { WorkspaceEntityMigrationBuilderService } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/services/workspace-entity-migration-builder.service';
import { type FlatEntityCreationValidationArgs } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/universal-flat-entity-creation-validation-args.type';
import { type FlatEntityUpdateValidationArgs } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/universal-flat-entity-update-validation-args.type';
import { type UniversalFlatEntityValidationArgs } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/universal-flat-entity-validation-args.type';
import { type UniversalFlatEntityValidationReturnType } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/universal-flat-entity-validation-result.type';

@Injectable()
export class WorkspaceMigrationValidationRuleActionsBuilderService extends WorkspaceEntityMigrationBuilderService<
  typeof ALL_METADATA_NAME.validationRule
> {
  constructor() {
    super(ALL_METADATA_NAME.validationRule);
  }

  protected validateFlatEntityCreation(
    args: FlatEntityCreationValidationArgs<
      typeof ALL_METADATA_NAME.validationRule
    >,
  ): UniversalFlatEntityValidationReturnType<
    typeof ALL_METADATA_NAME.validationRule,
    'create'
  > {
    return {
      status: 'success',
      action: {
        type: 'create',
        metadataName: 'validationRule',
        flatEntity: args.flatEntityToValidate,
      },
    };
  }

  protected validateFlatEntityDeletion(
    args: UniversalFlatEntityValidationArgs<
      typeof ALL_METADATA_NAME.validationRule
    >,
  ): UniversalFlatEntityValidationReturnType<
    typeof ALL_METADATA_NAME.validationRule,
    'delete'
  > {
    return {
      status: 'success',
      action: {
        type: 'delete',
        metadataName: 'validationRule',
        universalIdentifier: args.flatEntityToValidate.universalIdentifier,
      },
    };
  }

  protected validateFlatEntityUpdate(
    args: FlatEntityUpdateValidationArgs<
      typeof ALL_METADATA_NAME.validationRule
    >,
  ): UniversalFlatEntityValidationReturnType<
    typeof ALL_METADATA_NAME.validationRule,
    'update'
  > {
    return {
      status: 'success',
      action: {
        type: 'update',
        metadataName: 'validationRule',
        universalIdentifier: args.universalIdentifier,
        update: args.flatEntityUpdate,
      },
    };
  }
}
