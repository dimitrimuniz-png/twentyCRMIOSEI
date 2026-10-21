export type RelationPredicateValue = {
  id: string;
};

export type RowLevelPermissionPredicateValue =
  | string
  | number
  | boolean
  | string[]
  | RelationPredicateValue
  | Record<string, unknown>
  | null;
