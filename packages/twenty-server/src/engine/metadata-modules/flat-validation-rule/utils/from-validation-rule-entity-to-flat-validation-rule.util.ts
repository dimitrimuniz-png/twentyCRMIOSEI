import { type FlatValidationRule } from 'src/engine/metadata-modules/flat-validation-rule/types/flat-validation-rule.type';
import { fromEntityToScalarEntity } from 'src/engine/metadata-modules/flat-entity/utils/from-entity-to-scalar-entity.util';
import { type FromEntityToFlatEntityArgs } from 'src/engine/workspace-cache/types/from-entity-to-flat-entity-args.type';
import { resolveManyToOneRelationIdsToUniversalIdentifiers } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-many-to-one-relation-ids-to-universal-identifiers.util';

export const fromValidationRuleEntityToFlatValidationRule = (
  args: FromEntityToFlatEntityArgs<'validationRule'>,
): FlatValidationRule => {
  const { entity: validationRuleEntity } = args;

  return {
    ...fromEntityToScalarEntity({
      metadataName: 'validationRule',
      entity: validationRuleEntity,
    }),
    ...resolveManyToOneRelationIdsToUniversalIdentifiers({
      metadataName: 'validationRule',
      ...args,
    }),
  };
};
