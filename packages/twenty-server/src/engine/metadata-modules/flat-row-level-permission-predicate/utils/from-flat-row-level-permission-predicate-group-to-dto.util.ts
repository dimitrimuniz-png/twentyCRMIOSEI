import { type RowLevelPermissionPredicateGroupDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate-group.dto';
import { type FlatRowLevelPermissionPredicateGroup } from 'src/engine/metadata-modules/row-level-permission-predicate/types/flat-row-level-permission-predicate-group.type';

export const fromFlatRowLevelPermissionPredicateGroupToDto = (
  flatPredicateGroup: FlatRowLevelPermissionPredicateGroup,
): RowLevelPermissionPredicateGroupDTO => ({
  id: flatPredicateGroup.id,
  logicalOperator: flatPredicateGroup.logicalOperator,
  objectMetadataId: flatPredicateGroup.objectMetadataId,
  parentRowLevelPermissionPredicateGroupId:
    flatPredicateGroup.parentRowLevelPermissionPredicateGroupId,
  positionInRowLevelPermissionPredicateGroup:
    flatPredicateGroup.positionInRowLevelPermissionPredicateGroup,
  roleId: flatPredicateGroup.roleId,
});
