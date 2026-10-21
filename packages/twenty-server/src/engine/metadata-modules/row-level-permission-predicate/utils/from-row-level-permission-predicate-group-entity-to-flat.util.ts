import { fromEntityToScalarEntity } from 'src/engine/metadata-modules/flat-entity/utils/from-entity-to-scalar-entity.util';
import { type FlatRowLevelPermissionPredicateGroup } from 'src/engine/metadata-modules/row-level-permission-predicate/types/flat-row-level-permission-predicate-group.type';
import { type FromEntityToFlatEntityArgs } from 'src/engine/workspace-cache/types/from-entity-to-flat-entity-args.type';
import { resolveManyToOneRelationIdsToUniversalIdentifiers } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-many-to-one-relation-ids-to-universal-identifiers.util';

export const fromRowLevelPermissionPredicateGroupEntityToFlat = (
  args: FromEntityToFlatEntityArgs<'rowLevelPermissionPredicateGroup'>,
): FlatRowLevelPermissionPredicateGroup => {
  const { entity } = args;
  const predicates = entity.rowLevelPermissionPredicates ?? [];
  const childGroups = entity.childRowLevelPermissionPredicateGroups ?? [];

  return {
    ...fromEntityToScalarEntity({
      metadataName: 'rowLevelPermissionPredicateGroup',
      entity,
    }),
    ...resolveManyToOneRelationIdsToUniversalIdentifiers({
      metadataName: 'rowLevelPermissionPredicateGroup',
      ...args,
    }),
    rowLevelPermissionPredicateIds: predicates.map(({ id }) => id),
    rowLevelPermissionPredicateUniversalIdentifiers: predicates.map(
      ({ universalIdentifier }) => universalIdentifier,
    ),
    childRowLevelPermissionPredicateGroupIds: childGroups.map(({ id }) => id),
    childRowLevelPermissionPredicateGroupUniversalIdentifiers: childGroups.map(
      ({ universalIdentifier }) => universalIdentifier,
    ),
  };
};
