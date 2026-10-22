import { Injectable } from '@nestjs/common';

import { IsNull } from 'typeorm';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatRowLevelPermissionPredicateGroupMaps } from 'src/engine/metadata-modules/row-level-permission-predicate/types/flat-row-level-permission-predicate-group-maps.type';
import { fromRowLevelPermissionPredicateGroupEntityToFlat } from 'src/engine/metadata-modules/row-level-permission-predicate/utils/from-row-level-permission-predicate-group-entity-to-flat.util';
import { MetadataFlatEntityMapsCacheProvider } from 'src/engine/workspace-cache/interfaces/metadata-flat-entity-maps-cache-provider.service';
import { WorkspaceCache } from 'src/engine/workspace-cache/decorators/workspace-cache.decorator';
import { type WorkspaceCacheProviderContext } from 'src/engine/workspace-cache/types/workspace-cache-provider-context.type';
import { createIdToUniversalIdentifierMap } from 'src/engine/workspace-cache/utils/create-id-to-universal-identifier-map.util';
import { addFlatEntityToFlatEntityMapsThroughMutationOrThrow } from 'src/engine/workspace-manager/workspace-migration/utils/add-flat-entity-to-flat-entity-maps-through-mutation-or-throw.util';

const FLAT_ROW_LEVEL_PERMISSION_PREDICATE_GROUP_ROWS_REQUIREMENT = {
  rowLevelPermissionPredicateGroup: {
    columns: true,
    groupBy: ['parentRowLevelPermissionPredicateGroupId'],
    where: { deletedAt: IsNull() },
  },
  application: ['id', 'universalIdentifier'],
  objectMetadata: ['id', 'universalIdentifier'],
  role: ['id', 'universalIdentifier'],
  rowLevelPermissionPredicate: {
    columns: ['id', 'universalIdentifier'],
    groupBy: ['rowLevelPermissionPredicateGroupId'],
    where: { deletedAt: IsNull() },
  },
} as const;

@Injectable()
@WorkspaceCache('flatRowLevelPermissionPredicateGroupMaps', {
  packingPonderation: 1,
})
export class WorkspaceFlatRowLevelPermissionPredicateGroupMapCacheService extends MetadataFlatEntityMapsCacheProvider<'rowLevelPermissionPredicateGroup'> {
  override readonly rowsRequirement =
    FLAT_ROW_LEVEL_PERMISSION_PREDICATE_GROUP_ROWS_REQUIREMENT;

  computeForCache({
    rows,
  }: WorkspaceCacheProviderContext<
    typeof FLAT_ROW_LEVEL_PERMISSION_PREDICATE_GROUP_ROWS_REQUIREMENT
  >): FlatRowLevelPermissionPredicateGroupMaps {
    const {
      rowLevelPermissionPredicateGroup: predicateGroups,
      application: applications,
      objectMetadata: objectMetadatas,
      role: roles,
      rowLevelPermissionPredicate: predicates,
    } = rows;

    const flatMaps = createEmptyFlatEntityMaps();
    const applicationIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(applications);
    const objectMetadataIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(objectMetadatas);
    const roleIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(roles);
    const rowLevelPermissionPredicateGroupIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(predicateGroups.rows);

    for (const predicateGroup of predicateGroups.rows) {
      addFlatEntityToFlatEntityMapsThroughMutationOrThrow({
        flatEntity: fromRowLevelPermissionPredicateGroupEntityToFlat({
          entity: {
            ...predicateGroup,
            rowLevelPermissionPredicates:
              predicates.byRowLevelPermissionPredicateGroupId.get(
                predicateGroup.id,
              ) ?? [],
            childRowLevelPermissionPredicateGroups:
              predicateGroups.byParentRowLevelPermissionPredicateGroupId.get(
                predicateGroup.id,
              ) ?? [],
          },
          applicationIdToUniversalIdentifierMap,
          objectMetadataIdToUniversalIdentifierMap,
          roleIdToUniversalIdentifierMap,
          rowLevelPermissionPredicateGroupIdToUniversalIdentifierMap,
        }),
        flatEntityMapsToMutate: flatMaps,
      });
    }

    return flatMaps;
  }
}
