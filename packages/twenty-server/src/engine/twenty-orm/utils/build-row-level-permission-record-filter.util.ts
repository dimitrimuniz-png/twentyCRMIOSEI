import {
  FieldMetadataType,
  RelationType,
  RowLevelPermissionPredicateGroupLogicalOperator,
  RowLevelPermissionPredicateOperand,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type UserWorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { UNSATISFIABLE_RECORD_FILTER } from 'src/engine/twenty-orm/constants/unsatisfiable-record-filter.constant';

type PredicateRecord = {
  id: string;
  universalIdentifier: string;
  applicationId: string;
  workspaceId: string;
  roleId: string;
  objectMetadataId: string;
  fieldMetadataId: string;
  operand: RowLevelPermissionPredicateOperand | string;
  value: unknown;
  subFieldName: string | null;
  workspaceMemberFieldMetadataId: string | null;
  workspaceMemberSubFieldName: string | null;
  rowLevelPermissionPredicateGroupId: string | null;
  positionInRowLevelPermissionPredicateGroup: number | null;
  deletedAt: string | null;
};

type PredicateGroupRecord = {
  id: string;
  universalIdentifier: string;
  applicationId: string;
  workspaceId: string;
  roleId: string;
  logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator;
  parentRowLevelPermissionPredicateGroupId: string | null;
  positionInParentRowLevelPermissionPredicateGroup?: number | null;
  deletedAt: string | null;
};

type FieldLike = FlatFieldMetadata & {
  options?: Array<{ value: string }> | null;
  settings?: { relationType?: string; joinColumnName?: string } | null;
};

type BuildArgs = {
  flatRowLevelPermissionPredicateMaps: FlatEntityMaps<PredicateRecord>;
  flatRowLevelPermissionPredicateGroupMaps: FlatEntityMaps<PredicateGroupRecord>;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  objectMetadata: Pick<FlatObjectMetadata, 'id' | 'fieldIds'>;
  roleIds: string[];
  workspaceMember?: UserWorkspaceAuthContext['workspaceMember'];
};

export const buildRowLevelPermissionRecordFilter = ({
  roleIds,
  ...context
}: BuildArgs): RecordGqlOperationFilter | null => {
  if (roleIds.length === 0) {
    return null;
  }

  const roleFilters = roleIds.flatMap((roleId) => {
    const filter = buildRoleFilter({ ...context, roleId });

    return isDefined(filter) ? [filter] : [];
  });

  if (roleFilters.length === 0) {
    return null;
  }

  if (roleFilters.length === 1) {
    return roleFilters[0];
  }

  return { and: roleFilters };
};

const buildRoleFilter = ({
  roleId,
  objectMetadata,
  flatRowLevelPermissionPredicateMaps,
  flatRowLevelPermissionPredicateGroupMaps,
  flatFieldMetadataMaps,
  workspaceMember,
}: Omit<BuildArgs, 'roleIds'> & {
  roleId: string;
}): RecordGqlOperationFilter | null => {
  const predicates = listEntities(flatRowLevelPermissionPredicateMaps).filter(
    (predicate) =>
      predicate.roleId === roleId &&
      predicate.objectMetadataId === objectMetadata.id &&
      !isDefined(predicate.deletedAt),
  );
  const groups = listEntities(flatRowLevelPermissionPredicateGroupMaps).filter(
    (group) => group.roleId === roleId && !isDefined(group.deletedAt),
  );

  if (predicates.length === 0 && groups.length === 0) {
    return null;
  }

  return publish(
    combineNodes({
      logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator.AND,
      nodes: collectChildFilters({
        parentGroupId: null,
        predicates,
        groups,
        flatFieldMetadataMaps,
        workspaceMember,
      }),
      wrapSingle: false,
    }),
  );
};

const collectChildFilters = ({
  parentGroupId,
  predicates,
  groups,
  flatFieldMetadataMaps,
  workspaceMember,
}: {
  parentGroupId: string | null;
  predicates: PredicateRecord[];
  groups: PredicateGroupRecord[];
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  workspaceMember: UserWorkspaceAuthContext['workspaceMember'] | undefined;
}): Array<RecordGqlOperationFilter | typeof UNSATISFIABLE> => {
  const predicateFilters = predicates
    .filter(
      (predicate) =>
        (predicate.rowLevelPermissionPredicateGroupId ?? null) ===
        parentGroupId,
    )
    .sort(byPosition)
    .map((predicate) =>
      predicateToFilter({
        predicate,
        predicates,
        flatFieldMetadataMaps,
        workspaceMember,
      }),
    );
  const groupFilters = groups
    .filter(
      (group) =>
        (group.parentRowLevelPermissionPredicateGroupId ?? null) ===
        parentGroupId,
    )
    .flatMap((group) => {
      const combined = combineNodes({
        logicalOperator: group.logicalOperator,
        nodes: collectChildFilters({
          parentGroupId: group.id,
          predicates,
          groups,
          flatFieldMetadataMaps,
          workspaceMember,
        }),
        wrapSingle: true,
      });

      return isDefined(combined) ? [combined] : [];
    });

  return [...predicateFilters, ...groupFilters] as Array<
    RecordGqlOperationFilter | typeof UNSATISFIABLE
  >;
};

const UNSATISFIABLE = Symbol('unsatisfiable-row-level-permission');

const combineNodes = ({
  logicalOperator,
  nodes,
  wrapSingle,
}: {
  logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator;
  nodes: Array<RecordGqlOperationFilter | typeof UNSATISFIABLE>;
  wrapSingle: boolean;
}): RecordGqlOperationFilter | typeof UNSATISFIABLE | null => {
  const isOr =
    logicalOperator === RowLevelPermissionPredicateGroupLogicalOperator.OR;
  const satisfiable = nodes.filter(
    (node): node is RecordGqlOperationFilter => node !== UNSATISFIABLE,
  );

  if (!isOr && satisfiable.length !== nodes.length) {
    return UNSATISFIABLE;
  }

  if (satisfiable.length === 0) {
    return nodes.length === 0 ? null : UNSATISFIABLE;
  }

  if (satisfiable.length === 1 && !wrapSingle) {
    return satisfiable[0];
  }

  return isOr ? { or: satisfiable } : { and: satisfiable };
};

const publish = (
  filter: RecordGqlOperationFilter | typeof UNSATISFIABLE | null,
): RecordGqlOperationFilter | null => {
  if (!isDefined(filter)) {
    return null;
  }

  return filter === UNSATISFIABLE ? UNSATISFIABLE_RECORD_FILTER : filter;
};

const predicateToFilter = ({
  predicate,
  predicates,
  flatFieldMetadataMaps,
  workspaceMember,
}: {
  predicate: PredicateRecord;
  predicates: PredicateRecord[];
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  workspaceMember: UserWorkspaceAuthContext['workspaceMember'] | undefined;
}): RecordGqlOperationFilter | typeof UNSATISFIABLE => {
  const field = findField(predicate.fieldMetadataId, flatFieldMetadataMaps);

  if (!isDefined(field)) {
    return UNSATISFIABLE;
  }

  const resolvedValue = resolvePredicateValue({
    predicate,
    field,
    flatFieldMetadataMaps,
    workspaceMember,
  });

  if (resolvedValue === UNSATISFIABLE) {
    return UNSATISFIABLE;
  }

  if (isMorphField(field)) {
    return morphFilter({
      field,
      predicates,
      predicate,
      value: resolvedValue,
      flatFieldMetadataMaps,
    });
  }

  const leaf = operandToLeaf({
    operand: predicate.operand,
    value: resolvedValue,
    field,
  });

  if (!isDefined(leaf)) {
    return UNSATISFIABLE;
  }

  if (isDefined(predicate.subFieldName)) {
    return { [field.name]: { [predicate.subFieldName]: leaf } };
  }

  // SQL rendering rejects a relation name and compares the join column instead.
  const joinColumnName = relationJoinColumnName(field);

  return { [joinColumnName ?? field.name]: leaf };
};

const morphFilter = ({
  field,
  value,
  flatFieldMetadataMaps,
}: {
  field: FieldLike;
  predicates: PredicateRecord[];
  predicate: PredicateRecord;
  value: unknown;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
}): RecordGqlOperationFilter | typeof UNSATISFIABLE => {
  const selectedRecordIds = readSelectedRecordIds(value);

  if (!isDefined(selectedRecordIds)) {
    return UNSATISFIABLE;
  }

  const targets = listEntities(flatFieldMetadataMaps).filter(
    (candidate) =>
      candidate.morphId === field.morphId &&
      isDefined(candidate.relationTargetObjectMetadataId) &&
      relationSettings(candidate)?.relationType !== RelationType.ONE_TO_MANY,
  );

  if (targets.length === 0) {
    return UNSATISFIABLE;
  }

  const branches = targets.map((target) => ({
    [relationSettings(target)?.joinColumnName ?? `${target.name}Id`]: {
      in: selectedRecordIds,
    },
  }));

  return branches.length === 1 ? branches[0] : { or: branches };
};

const resolvePredicateValue = ({
  predicate,
  field,
  flatFieldMetadataMaps,
  workspaceMember,
}: {
  predicate: PredicateRecord;
  field: FieldLike;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  workspaceMember: UserWorkspaceAuthContext['workspaceMember'] | undefined;
}): unknown | typeof UNSATISFIABLE => {
  if (!isDefined(predicate.workspaceMemberFieldMetadataId)) {
    return predicate.value;
  }

  if (!isDefined(workspaceMember)) {
    return UNSATISFIABLE;
  }

  const memberField = findField(
    predicate.workspaceMemberFieldMetadataId,
    flatFieldMetadataMaps,
  );

  if (!isDefined(memberField)) {
    return UNSATISFIABLE;
  }

  const memberRecord = workspaceMember as unknown as Record<string, unknown>;
  const rawValue = readMemberFieldValue(memberRecord, memberField);
  const value =
    isDefined(predicate.workspaceMemberSubFieldName) && isRecord(rawValue)
      ? rawValue[predicate.workspaceMemberSubFieldName]
      : rawValue;

  if (!isDefined(value) || value === '') {
    return UNSATISFIABLE;
  }

  if (!valueFitsField(value, field)) {
    return UNSATISFIABLE;
  }

  return value;
};

const operandToLeaf = ({
  operand,
  value,
  field,
}: {
  operand: string;
  value: unknown;
  field: FieldLike;
}): Record<string, unknown> | undefined => {
  switch (operand) {
    case RowLevelPermissionPredicateOperand.CONTAINS:
      return { ilike: `%${String(value)}%` };
    case RowLevelPermissionPredicateOperand.DOES_NOT_CONTAIN:
      return { not: { ilike: `%${String(value)}%` } };
    case RowLevelPermissionPredicateOperand.IS: {
      const selectedRecordIds = readSelectedRecordIds(value);

      if (isDefined(selectedRecordIds)) {
        return { in: selectedRecordIds };
      }

      if (
        field.type === FieldMetadataType.SELECT ||
        field.type === FieldMetadataType.MULTI_SELECT
      ) {
        return { in: [value] };
      }

      return { eq: value };
    }
    case RowLevelPermissionPredicateOperand.IS_NOT:
      return { not: { eq: value } };
    case RowLevelPermissionPredicateOperand.IS_EMPTY:
      return { is: 'NULL' };
    case RowLevelPermissionPredicateOperand.IS_NOT_EMPTY:
    case RowLevelPermissionPredicateOperand.IS_NOT_NULL:
      return { is: 'NOT_NULL' };
    case RowLevelPermissionPredicateOperand.GREATER_THAN_OR_EQUAL:
      return { gte: value };
    case RowLevelPermissionPredicateOperand.LESS_THAN_OR_EQUAL:
      return { lte: value };
    default:
      return undefined;
  }
};

const valueFitsField = (value: unknown, field: FieldLike): boolean => {
  if (
    field.type !== FieldMetadataType.SELECT &&
    field.type !== FieldMetadataType.MULTI_SELECT
  ) {
    return true;
  }

  const options = field.options ?? [];

  return options.some((option) => option.value === value);
};

const readSelectedRecordIds = (value: unknown): string[] | undefined => {
  if (!isRecord(value) || !Array.isArray(value.selectedRecordIds)) {
    return undefined;
  }

  return value.selectedRecordIds.filter(
    (recordId): recordId is string => typeof recordId === 'string',
  );
};

const isMorphField = (field: FieldLike): boolean =>
  field.type === FieldMetadataType.MORPH_RELATION && isDefined(field.morphId);

const findField = (
  fieldId: string,
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
): FieldLike | undefined =>
  findFlatEntityByIdInFlatEntityMaps({
    flatEntityId: fieldId,
    flatEntityMaps: flatFieldMetadataMaps,
  }) as FieldLike | undefined;

const listEntities = <T extends SyncableFlatEntity>(
  maps: FlatEntityMaps<T>,
): T[] =>
  Object.values(maps.byUniversalIdentifier).filter((entity): entity is T =>
    isDefined(entity),
  );

const relationSettings = (
  field: FlatFieldMetadata,
): { relationType?: string; joinColumnName?: string } | undefined =>
  isDefined(field.settings)
    ? (field.settings as { relationType?: string; joinColumnName?: string })
    : undefined;

const relationJoinColumnName = (field: FieldLike): string | undefined => {
  if (field.type !== FieldMetadataType.RELATION) {
    return undefined;
  }

  return relationSettings(field)?.joinColumnName ?? `${field.name}Id`;
};

const readMemberFieldValue = (
  record: Record<string, unknown>,
  field: FieldLike,
): unknown => {
  const directValue = record[field.name];

  if (isRecord(directValue) && typeof directValue.id === 'string') {
    return directValue.id;
  }

  if (isDefined(directValue) && directValue !== '') {
    return directValue;
  }

  const joinColumnName = relationJoinColumnName(field);

  if (isDefined(joinColumnName) && joinColumnName in record) {
    return record[joinColumnName];
  }

  return directValue;
};

const byPosition = (left: PredicateRecord, right: PredicateRecord): number =>
  (left.positionInRowLevelPermissionPredicateGroup ?? 0) -
  (right.positionInRowLevelPermissionPredicateGroup ?? 0);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
