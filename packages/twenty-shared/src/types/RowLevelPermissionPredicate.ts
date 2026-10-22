import { type RowLevelPermissionPredicateOperand } from '@/types/RowLevelPermissionPredicateOperand';
import { type RowLevelPermissionPredicateValue } from '@/types/RowLevelPermissionPredicateValue';

export type RowLevelPermissionPredicate = {
  id: string;
  fieldMetadataId: string;
  objectMetadataId: string;
  operand: RowLevelPermissionPredicateOperand;
  value: RowLevelPermissionPredicateValue;
  subFieldName: string | null;
  workspaceMemberFieldMetadataId: string | null;
  workspaceMemberSubFieldName: string | null;
  rowLevelPermissionPredicateGroupId: string | null;
  positionInRowLevelPermissionPredicateGroup: number | null;
  roleId: string;
};
