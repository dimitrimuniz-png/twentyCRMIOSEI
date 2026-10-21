import { type RowLevelPermissionPredicateDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate.dto';
import { type FlatRowLevelPermissionPredicate } from 'src/engine/metadata-modules/row-level-permission-predicate/types/flat-row-level-permission-predicate.type';

export const fromFlatRowLevelPermissionPredicateToDto = (
  flatPredicate: FlatRowLevelPermissionPredicate,
): RowLevelPermissionPredicateDTO => ({
  id: flatPredicate.id,
  fieldMetadataId: flatPredicate.fieldMetadataId,
  objectMetadataId: flatPredicate.objectMetadataId,
  operand: flatPredicate.operand,
  positionInRowLevelPermissionPredicateGroup:
    flatPredicate.positionInRowLevelPermissionPredicateGroup,
  roleId: flatPredicate.roleId,
  rowLevelPermissionPredicateGroupId:
    flatPredicate.rowLevelPermissionPredicateGroupId,
  subFieldName: flatPredicate.subFieldName,
  value: flatPredicate.value,
  workspaceMemberFieldMetadataId: flatPredicate.workspaceMemberFieldMetadataId,
  workspaceMemberSubFieldName: flatPredicate.workspaceMemberSubFieldName,
});
