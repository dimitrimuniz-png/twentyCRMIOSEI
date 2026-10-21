import { type RowLevelPermissionPredicateValue } from 'twenty-shared/types';

export const toRowLevelPermissionPredicateValue = (
  value: unknown,
): RowLevelPermissionPredicateValue => {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.every((item) => typeof item === 'string') ? value : null;
  }

  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return null;
};
