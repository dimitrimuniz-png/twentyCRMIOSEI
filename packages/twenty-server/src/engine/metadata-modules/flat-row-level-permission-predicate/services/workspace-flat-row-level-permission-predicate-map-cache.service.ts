import { Injectable } from '@nestjs/common';

import { IsNull } from 'typeorm';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type FlatRowLevelPermissionPredicateMaps } from 'src/engine/metadata-modules/row-level-permission-predicate/types/flat-row-level-permission-predicate-maps.type';
import { fromRowLevelPermissionPredicateEntityToFlat } from 'src/engine/metadata-modules/row-level-permission-predicate/utils/from-row-level-permission-predicate-entity-to-flat.util';
import { MetadataFlatEntityMapsCacheProvider } from 'src/engine/workspace-cache/interfaces/metadata-flat-entity-maps-cache-provider.service';
import { WorkspaceCache } from 'src/engine/workspace-cache/decorators/workspace-cache.decorator';
import { type WorkspaceCacheProviderContext } from 'src/engine/workspace-cache/types/workspace-cache-provider-context.type';
import { createIdToUniversalIdentifierMap } from 'src/engine/workspace-cache/utils/create-id-to-universal-identifier-map.util';
import { addFlatEntityToFlatEntityMapsThroughMutationOrThrow } from 'src/engine/workspace-manager/workspace-migration/utils/add-flat-entity-to-flat-entity-maps-through-mutation-or-throw.util';

const FLAT_ROW_LEVEL_PERMISSION_PREDICATE_ROWS_REQUIREMENT = {
  rowLevelPermissionPredicate: {
    columns: true,
    where: { deletedAt: IsNull() },
  },
  application: ['id', 'universalIdentifier'],
  role: ['id', 'universalIdentifier'],
  fieldMetadata: ['id', 'universalIdentifier'],
  objectMetadata: ['id', 'universalIdentifier'],
  rowLevelPermissionPredicateGroup: ['id', 'universalIdentifier'],
} as const;

@Injectable()
@WorkspaceCache('flatRowLevelPermissionPredicateMaps', {
  packingPonderation: 1,
})
export class WorkspaceFlatRowLevelPermissionPredicateMapCacheService extends MetadataFlatEntityMapsCacheProvider<'rowLevelPermissionPredicate'> {
  override readonly rowsRequirement =
    FLAT_ROW_LEVEL_PERMISSION_PREDICATE_ROWS_REQUIREMENT;

  computeForCache({
    rows,
  }: WorkspaceCacheProviderContext<
    typeof FLAT_ROW_LEVEL_PERMISSION_PREDICATE_ROWS_REQUIREMENT
  >): FlatRowLevelPermissionPredicateMaps {
    const {
      rowLevelPermissionPredicate: predicates,
      application: applications,
      role: roles,
      fieldMetadata: fieldMetadatas,
      objectMetadata: objectMetadatas,
      rowLevelPermissionPredicateGroup: predicateGroups,
    } = rows;

    const flatMaps = createEmptyFlatEntityMaps();
    const applicationIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(applications);
    const roleIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(roles);
    const fieldMetadataIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(fieldMetadatas);
    const objectMetadataIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(objectMetadatas);
    const rowLevelPermissionPredicateGroupIdToUniversalIdentifierMap =
      createIdToUniversalIdentifierMap(predicateGroups);

    for (const predicate of predicates) {
      addFlatEntityToFlatEntityMapsThroughMutationOrThrow({
        flatEntity: fromRowLevelPermissionPredicateEntityToFlat({
          entity: predicate,
          applicationIdToUniversalIdentifierMap,
          roleIdToUniversalIdentifierMap,
          fieldMetadataIdToUniversalIdentifierMap,
          objectMetadataIdToUniversalIdentifierMap,
          rowLevelPermissionPredicateGroupIdToUniversalIdentifierMap,
        }),
        flatEntityMapsToMutate: flatMaps,
      });
    }

    return flatMaps;
  }
}
