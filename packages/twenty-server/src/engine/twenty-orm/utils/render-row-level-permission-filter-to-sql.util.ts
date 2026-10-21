import { randomBytes } from 'crypto';

import {
  FieldMetadataType,
  compositeTypeDefinitions,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { computeCompositeColumnName } from 'src/engine/metadata-modules/field-metadata/utils/compute-column-name.util';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

export type RowLevelPermissionSqlFragment = {
  sql: string;
  parameters: Record<string, unknown>;
};

const COMPARISON_OPERATORS = new Set([
  'eq',
  'neq',
  'in',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'ilike',
  'startsWith',
  'endsWith',
  'contains',
  'containsIlike',
  'is',
  'isEmpty',
]);

type FieldLike = {
  id: string;
  name: string;
  type: FieldMetadataType;
  settings?: { relationType?: string; joinColumnName?: string } | null;
};

export const renderRowLevelPermissionFilterToSql = ({
  recordFilter,
  objectMetadata,
  flatFieldMetadataMaps,
  tableAlias,
}: {
  recordFilter: RecordGqlOperationFilter;
  objectMetadata: Pick<FlatObjectMetadata, 'fieldIds' | 'nameSingular'>;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  tableAlias: string;
}): RowLevelPermissionSqlFragment | null => {
  if (!isDefined(recordFilter) || Object.keys(recordFilter).length === 0) {
    return null;
  }

  return renderNode({
    filter: recordFilter,
    fields: listObjectFields(objectMetadata, flatFieldMetadataMaps),
    alias: quoteIdentifier(tableAlias),
  });
};

const renderNode = ({
  filter,
  fields,
  alias,
}: {
  filter: RecordGqlOperationFilter;
  fields: FieldLike[];
  alias: string;
}): RowLevelPermissionSqlFragment => {
  const parts: RowLevelPermissionSqlFragment[] = [];

  if (isDefined(filter.and)) {
    parts.push(
      renderLogical({
        operator: 'AND',
        nodes: asFilterList(filter.and),
        fields,
        alias,
      }),
    );
  }

  if (isDefined(filter.or)) {
    parts.push(
      renderLogical({
        operator: 'OR',
        nodes: asFilterList(filter.or),
        fields,
        alias,
      }),
    );
  }

  if (isDefined(filter.not)) {
    const inner = renderNode({ filter: filter.not, fields, alias });

    parts.push({ sql: `NOT (${inner.sql})`, parameters: inner.parameters });
  }

  for (const [fieldName, expression] of Object.entries(filter)) {
    if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
      continue;
    }

    parts.push(renderField({ fieldName, expression, fields, alias }));
  }

  if (parts.length === 0) {
    return { sql: '1=1', parameters: {} };
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return {
    sql: `(${parts.map((part) => part.sql).join(' AND ')})`,
    parameters: mergeParameters(parts),
  };
};

const renderLogical = ({
  operator,
  nodes,
  fields,
  alias,
}: {
  operator: 'AND' | 'OR';
  nodes: RecordGqlOperationFilter[];
  fields: FieldLike[];
  alias: string;
}): RowLevelPermissionSqlFragment => {
  if (nodes.length === 0) {
    return { sql: '1=1', parameters: {} };
  }

  const rendered = nodes.map((node) => renderNode({ filter: node, fields, alias }));

  return {
    sql: `(${rendered.map((part) => part.sql).join(` ${operator} `)})`,
    parameters: mergeParameters(rendered),
  };
};

const renderField = ({
  fieldName,
  expression,
  fields,
  alias,
}: {
  fieldName: string;
  expression: unknown;
  fields: FieldLike[];
  alias: string;
}): RowLevelPermissionSqlFragment => {
  const field = resolveField(fieldName, fields);

  if (
    field.type === FieldMetadataType.RELATION ||
    field.type === FieldMetadataType.MORPH_RELATION
  ) {
    throw new Error(
      `Field "${fieldName}" is a relation; traversing a relation requires an additional join`,
    );
  }

  const composite = compositeTypeDefinitions.get(field.type);

  if (isDefined(composite) && isRecord(expression)) {
    const propertyNames = new Set(
      composite.properties.map((property) => property.name),
    );
    const keys = Object.keys(expression);
    const mentionsSubField = keys.some((key) => propertyNames.has(key));

    if (mentionsSubField || keys.some((key) => !COMPARISON_OPERATORS.has(key))) {
      const parts = keys.map((subFieldName) => {
        const property = composite.properties.find(
          (candidate) => candidate.name === subFieldName,
        );

        if (!isDefined(property)) {
          throw new Error(
            `"${subFieldName}" is not a sub field of composite type ${field.type}`,
          );
        }

        const columnName = computeCompositeColumnName(
          { name: field.name, type: field.type },
          property,
        );

        return renderOperators({
          columnName,
          columnSql: `${alias}.${quoteIdentifier(columnName)}`,
          castAsText: property.type === FieldMetadataType.TEXT,
          expression: expression[subFieldName],
        });
      });

      return parts.length === 1
        ? parts[0]
        : {
            sql: `(${parts.map((part) => part.sql).join(' AND ')})`,
            parameters: mergeParameters(parts),
          };
    }
  }

  return renderOperators({
    columnName: field.name,
    columnSql: `${alias}.${quoteIdentifier(field.name)}`,
    castAsText: field.type === FieldMetadataType.TEXT,
    expression,
  });
};

const renderOperators = ({
  columnName,
  columnSql,
  castAsText,
  expression,
}: {
  columnName: string;
  columnSql: string;
  castAsText: boolean;
  expression: unknown;
}): RowLevelPermissionSqlFragment => {
  if (!isRecord(expression)) {
    throw new Error('A row-level permission filter leaf must be an object');
  }

  const parts = Object.entries(expression).map(([operator, value]) =>
    renderOperator({ columnName, columnSql, castAsText, operator, value }),
  );

  if (parts.length === 0) {
    return { sql: '1=1', parameters: {} };
  }

  const wrapped = parts.map((part) => ({
    sql: `(${part.sql})`,
    parameters: part.parameters,
  }));

  if (wrapped.length === 1) {
    return wrapped[0];
  }

  return {
    sql: `(${wrapped.map((part) => part.sql).join(' AND ')})`,
    parameters: mergeParameters(wrapped),
  };
};

const renderOperator = ({
  columnName,
  columnSql,
  castAsText,
  operator,
  value,
}: {
  columnName: string;
  columnSql: string;
  castAsText: boolean;
  operator: string;
  value: unknown;
}): RowLevelPermissionSqlFragment => {
  const column = castAsText ? `${columnSql}::text` : columnSql;

  switch (operator) {
    case 'eq':
      return comparison(column, '=', columnName, value);
    case 'neq':
      return comparison(column, '!=', columnName, value);
    case 'gt':
      return comparison(columnSql, '>', columnName, value);
    case 'gte':
      return comparison(columnSql, '>=', columnName, value);
    case 'lt':
      return comparison(columnSql, '<', columnName, value);
    case 'lte':
      return comparison(columnSql, '<=', columnName, value);
    case 'in': {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('Expected non-empty array');
      }

      const parameterKey = buildParameterKey(columnName);

      return {
        sql: `${column} IN (:...${parameterKey})`,
        parameters: { [parameterKey]: value },
      };
    }
    case 'like':
      return comparison(column, 'LIKE', columnName, value);
    case 'ilike':
    case 'containsIlike':
      return comparison(column, 'ILIKE', columnName, value);
    case 'startsWith':
      return comparison(column, 'ILIKE', columnName, `${String(value)}%`);
    case 'endsWith':
      return comparison(column, 'ILIKE', columnName, `%${String(value)}`);
    case 'contains':
      return comparison(column, 'ILIKE', columnName, `%${String(value)}%`);
    case 'is':
      if (value === 'NULL') {
        return { sql: `${columnSql} IS NULL`, parameters: {} };
      }

      if (value === 'NOT_NULL') {
        return { sql: `${columnSql} IS NOT NULL`, parameters: {} };
      }

      throw new Error(`Unsupported "is" operand "${String(value)}"`);
    case 'isEmpty':
      return value === true
        ? {
            sql: `(${columnSql} IS NULL OR ${column} = '')`,
            parameters: {},
          }
        : {
            sql: `(${columnSql} IS NOT NULL AND ${column} != '')`,
            parameters: {},
          };
    default:
      throw new Error(`Unsupported row-level permission operator "${operator}"`);
  }
};

const comparison = (
  column: string,
  sqlOperator: string,
  columnName: string,
  value: unknown,
): RowLevelPermissionSqlFragment => {
  const parameterKey = buildParameterKey(columnName);

  return {
    sql: `${column} ${sqlOperator} :${parameterKey}`,
    parameters: { [parameterKey]: value },
  };
};

const resolveField = (fieldName: string, fields: FieldLike[]): FieldLike => {
  const direct = fields.find((field) => field.name === fieldName);

  if (isDefined(direct)) {
    return direct;
  }

  const byJoinColumn = fields.find(
    (field) => field.settings?.joinColumnName === fieldName,
  );

  if (isDefined(byJoinColumn)) {
    return { ...byJoinColumn, name: fieldName, type: FieldMetadataType.UUID };
  }

  throw new Error(`field "${fieldName}" does not exist`);
};

const listObjectFields = (
  objectMetadata: Pick<FlatObjectMetadata, 'fieldIds'>,
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
): FieldLike[] =>
  objectMetadata.fieldIds.flatMap((fieldId) => {
    const field = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: fieldId,
      flatEntityMaps: flatFieldMetadataMaps,
    });

    return isDefined(field) ? [field as FieldLike] : [];
  });

const asFilterList = (
  value: RecordGqlOperationFilter | RecordGqlOperationFilter[],
): RecordGqlOperationFilter[] => (Array.isArray(value) ? value : [value]);

const buildParameterKey = (columnName: string): string =>
  `${columnName}${randomBytes(5).toString('hex')}`;

const quoteIdentifier = (identifier: string): string => `"${identifier}"`;

const mergeParameters = (
  parts: RowLevelPermissionSqlFragment[],
): Record<string, unknown> =>
  Object.assign({}, ...parts.map((part) => part.parameters));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
