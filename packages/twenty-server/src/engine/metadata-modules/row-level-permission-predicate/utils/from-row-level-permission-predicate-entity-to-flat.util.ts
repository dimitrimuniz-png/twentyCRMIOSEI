import { fromEntityToScalarEntity } from 'src/engine/metadata-modules/flat-entity/utils/from-entity-to-scalar-entity.util';
import { type FlatRowLevelPermissionPredicate } from 'src/engine/metadata-modules/row-level-permission-predicate/types/flat-row-level-permission-predicate.type';
import { type FromEntityToFlatEntityArgs } from 'src/engine/workspace-cache/types/from-entity-to-flat-entity-args.type';
import { resolveManyToOneRelationIdsToUniversalIdentifiers } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-many-to-one-relation-ids-to-universal-identifiers.util';

export const fromRowLevelPermissionPredicateEntityToFlat = (
  args: FromEntityToFlatEntityArgs<'rowLevelPermissionPredicate'>,
): FlatRowLevelPermissionPredicate => ({
  ...fromEntityToScalarEntity({
    metadataName: 'rowLevelPermissionPredicate',
    entity: args.entity,
  }),
  ...resolveManyToOneRelationIdsToUniversalIdentifiers({
    metadataName: 'rowLevelPermissionPredicate',
    ...args,
  }),
});
