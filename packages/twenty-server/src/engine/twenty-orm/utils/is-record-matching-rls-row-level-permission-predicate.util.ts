import {
  FieldMetadataType,
  compositeTypeDefinitions,
  type ObjectRecord,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AccessibleFlatFieldMetadataMaps } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

type FieldLike = {
  name: string;
  type: FieldMetadataType;
  settings?: { joinColumnName?: string } | null;
};

export const isRecordMatchingRLSRowLevelPermissionPredicate = ({
  record,
  filter,
  flatObjectMetadata,
  flatFieldMetadataMaps,
  shouldIgnoreSoftDeleteDefaultFilter = false,
}: {
  record: ObjectRecord;
  filter: RecordGqlOperationFilter;
  flatObjectMetadata: Pick<FlatObjectMetadata, 'fieldIds'>;
  flatFieldMetadataMaps: AccessibleFlatFieldMetadataMaps;
  shouldIgnoreSoftDeleteDefaultFilter?: boolean;
}): boolean => {
  if (
    !shouldIgnoreSoftDeleteDefaultFilter &&
    isDeletedAndNotExplicitlyFiltered(record, filter)
  ) {
    return false;
  }

  return matchesFilter({
    record,
    filter,
    fields: listFields(flatObjectMetadata, flatFieldMetadataMaps),
  });
};

const matchesFilter = ({
  record,
  filter,
  fields,
}: {
  record: ObjectRecord;
  filter: RecordGqlOperationFilter;
  fields: FieldLike[];
}): boolean => {
  if (!isDefined(filter) || Object.keys(filter).length === 0) {
    return true;
  }

  const checks: boolean[] = [];
  const logical = asLogicalFilter(filter);

  if (isDefined(logical.and)) {
    const nodes = asFilterList(logical.and);

    checks.push(
      nodes.every((node) => matchesFilter({ record, filter: node, fields })),
    );
  }

  if (isDefined(logical.or)) {
    // A bare object is one filter whose keys are combined, which is an AND.
    // An array is a real disjunction.
    if (Array.isArray(logical.or)) {
      checks.push(
        logical.or.some((node) =>
          matchesFilter({ record, filter: node, fields }),
        ),
      );
    } else {
      checks.push(matchesFilter({ record, filter: logical.or, fields }));
    }
  }

  if (isDefined(logical.not)) {
    checks.push(!matchesFilter({ record, filter: logical.not, fields }));
  }

  for (const [fieldName, expression] of Object.entries(filter)) {
    if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
      continue;
    }

    checks.push(matchesField({ record, fieldName, expression, fields }));
  }

  return checks.every(Boolean);
};

const matchesField = ({
  record,
  fieldName,
  expression,
  fields,
}: {
  record: ObjectRecord;
  fieldName: string;
  expression: unknown;
  fields: FieldLike[];
}): boolean => {
  if (!isDefined(expression)) {
    return true;
  }

  const field =
    fields.find((candidate) => candidate.name === fieldName) ??
    fields.find(
      (candidate) => candidate.settings?.joinColumnName === fieldName,
    );

  if (
    isDefined(field) &&
    (field.type === FieldMetadataType.RELATION ||
      field.type === FieldMetadataType.MORPH_RELATION) &&
    field.name === fieldName &&
    isRecord(expression)
  ) {
    return matchesRelation({ record, field, expression });
  }

  const composite = isDefined(field)
    ? compositeTypeDefinitions.get(field.type)
    : undefined;

  if (isDefined(composite) && isRecord(expression)) {
    const recordValue = record[fieldName];
    const compositeRecord = isRecord(recordValue) ? recordValue : null;

    return Object.entries(expression).every(([subFieldName, subFilter]) => {
      if (
        !isDefined(subFilter) ||
        (isRecord(subFilter) && isEmpty(subFilter))
      ) {
        return true;
      }

      const property = composite.properties.find(
        (candidate) => candidate.name === subFieldName,
      );

      if (!isDefined(property)) {
        return false;
      }

      return matchesOperators(
        compositeRecord?.[subFieldName] ?? null,
        subFilter,
      );
    });
  }

  const value =
    fieldName in (record as Record<string, unknown>)
      ? record[fieldName]
      : undefined;

  return matchesOperators(value, expression);
};

const matchesRelation = ({
  record,
  field,
  expression,
}: {
  record: ObjectRecord;
  field: FieldLike;
  expression: Record<string, unknown>;
}): boolean => {
  if (field.name in (record as Record<string, unknown>)) {
    const related = record[field.name];
    const relatedId = isRecord(related) ? (related.id ?? null) : null;

    return matchesOperators(relatedId, expression);
  }

  const joinColumnName = field.settings?.joinColumnName ?? `${field.name}Id`;

  return matchesOperators(record[joinColumnName] ?? null, expression);
};

const matchesOperators = (value: unknown, expression: unknown): boolean => {
  if (!isDefined(expression)) {
    return true;
  }

  if (!isRecord(expression)) {
    return false;
  }

  if (isEmpty(expression)) {
    return true;
  }

  return Object.entries(expression).every(([operator, expected]) =>
    matchesOperator(value, operator, expected),
  );
};

const matchesOperator = (
  value: unknown,
  operator: string,
  expected: unknown,
): boolean => {
  switch (operator) {
    case 'eq':
      return value === expected;
    case 'neq':
      return value !== expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(value);
    case 'gt':
      return isComparable(value) && isComparable(expected) && value > expected;
    case 'gte':
      return isComparable(value) && isComparable(expected) && value >= expected;
    case 'lt':
      return isComparable(value) && isComparable(expected) && value < expected;
    case 'lte':
      return isComparable(value) && isComparable(expected) && value <= expected;
    case 'like':
      return matchesLike(value, expected, false);
    case 'ilike':
    case 'containsIlike':
      return matchesLike(value, expected, true);
    case 'startsWith':
      return matchesLike(value, `${String(expected)}%`, true);
    case 'endsWith':
      return matchesLike(value, `%${String(expected)}`, true);
    case 'contains':
      return matchesLike(value, `%${String(expected)}%`, true);
    case 'is':
      if (expected === 'NULL') {
        return !isDefined(value);
      }

      if (expected === 'NOT_NULL') {
        return isDefined(value);
      }

      return false;
    case 'isEmpty':
      return expected === true
        ? !isDefined(value) || value === ''
        : isDefined(value) && value !== '';
    default:
      return false;
  }
};

const matchesLike = (
  value: unknown,
  pattern: unknown,
  caseInsensitive: boolean,
): boolean => {
  if (!isDefined(value) || !isDefined(pattern)) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => matchesLike(item, pattern, caseInsensitive));
  }

  const source = caseInsensitive ? String(value).toLowerCase() : String(value);
  const expression = likeToRegExp(String(pattern), caseInsensitive);

  return expression.test(source);
};

const likeToRegExp = (pattern: string, caseInsensitive: boolean): RegExp => {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');

  return new RegExp(`^${escaped}$`, caseInsensitive ? 'i' : undefined);
};

const isDeletedAndNotExplicitlyFiltered = (
  record: ObjectRecord,
  filter: RecordGqlOperationFilter,
): boolean =>
  isDefined(record.deletedAt) && !filterMentions(filter, 'deletedAt');

const filterMentions = (
  filter: RecordGqlOperationFilter | undefined,
  fieldName: string,
): boolean => {
  if (!isDefined(filter)) {
    return false;
  }

  if (fieldName in filter) {
    return true;
  }

  const logical = asLogicalFilter(filter);

  return [logical.and, logical.or, logical.not].some((child) => {
    if (!isDefined(child)) {
      return false;
    }

    const nodes = Array.isArray(child) ? child : [child];

    return nodes.some((node) => filterMentions(node, fieldName));
  });
};

const listFields = (
  flatObjectMetadata: Pick<FlatObjectMetadata, 'fieldIds'>,
  flatFieldMetadataMaps: AccessibleFlatFieldMetadataMaps,
): FieldLike[] =>
  flatObjectMetadata.fieldIds.flatMap((fieldId) => {
    const field = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: fieldId,
      flatEntityMaps:
        flatFieldMetadataMaps as FlatEntityMaps<FlatFieldMetadata>,
    });

    return isDefined(field) ? [toFieldLike(field)] : [];
  });

const toFieldLike = (field: FlatFieldMetadata): FieldLike => {
  const joinColumnName =
    field.settings !== null &&
    typeof field.settings === 'object' &&
    'joinColumnName' in field.settings &&
    typeof field.settings.joinColumnName === 'string'
      ? field.settings.joinColumnName
      : undefined;

  return {
    name: field.name,
    type: field.type,
    settings: isDefined(joinColumnName) ? { joinColumnName } : null,
  };
};

type LogicalFilter = {
  and?: RecordGqlOperationFilter[];
  or?: RecordGqlOperationFilter[] | RecordGqlOperationFilter;
  not?: RecordGqlOperationFilter;
};

const asLogicalFilter = (filter: RecordGqlOperationFilter): LogicalFilter =>
  filter as LogicalFilter;

const asFilterList = (
  value: RecordGqlOperationFilter | RecordGqlOperationFilter[],
): RecordGqlOperationFilter[] => (Array.isArray(value) ? value : [value]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEmpty = (value: Record<string, unknown>): boolean =>
  Object.keys(value).length === 0;

const isComparable = (value: unknown): value is number | string =>
  typeof value === 'number' || typeof value === 'string';
