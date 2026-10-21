import { type RowLevelPermissionPredicateGroupLogicalOperator } from '@/types/RowLevelPermissionPredicateGroupLogicalOperator';

export type RowLevelPermissionPredicateGroup = {
  __typename?: 'RowLevelPermissionPredicateGroup';
  id: string;
  objectMetadataId: string;
  logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator;
  parentRowLevelPermissionPredicateGroupId: string | null;
  positionInRowLevelPermissionPredicateGroup: number | null;
  roleId: string;
};
