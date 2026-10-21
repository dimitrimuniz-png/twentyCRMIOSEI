import { gql } from '@apollo/client';

export const ROW_LEVEL_PERMISSION_PREDICATE_FRAGMENT = gql`
  fragment RowLevelPermissionPredicateFragment on RowLevelPermissionPredicate {
    id
    roleId
    objectMetadataId
    fieldMetadataId
    subFieldName
    operand
    value
    workspaceMemberFieldMetadataId
    workspaceMemberSubFieldName
    rowLevelPermissionPredicateGroupId
    positionInRowLevelPermissionPredicateGroup
  }
`;
