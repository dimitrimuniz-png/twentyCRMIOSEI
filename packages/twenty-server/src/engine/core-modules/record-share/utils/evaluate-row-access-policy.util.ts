import { RecordShareAccessLevel, type ObjectRecord } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type RecordShareGrant } from 'src/engine/core-modules/record-share/types/record-share-grant.type';

import { type AccessibleFlatFieldMetadataMaps } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { isRecordMatchingRLSRowLevelPermissionPredicate } from 'src/engine/twenty-orm/utils/is-record-matching-rls-row-level-permission-predicate.util';
import {
  type RowAccessExpression,
  type RowAccessPolicy,
} from 'src/engine/twenty-orm/types/row-access-policy.type';

export type RowAccessRecord = ObjectRecord & { id: string };

export type RowAccessEvaluationContext<
  TRecord extends RowAccessRecord = RowAccessRecord,
> = {
  flatFieldMetadataMaps: AccessibleFlatFieldMetadataMaps;
  shouldIgnoreSoftDeleteDefaultFilter: boolean;
  fetchRecordShares: (args: {
    objectMetadataId: string;
    recordIds: string[];
  }) => Promise<RecordShareGrant[]>;
  resolveRecordIdsReadableThroughParents?: (args: {
    records: TRecord[];
  }) => Promise<Set<string>>;
};

export const evaluateRowAccessPolicy = async <TRecord extends RowAccessRecord>({
  policy,
  records,
  context,
}: {
  policy: RowAccessPolicy;
  records: TRecord[];
  context: RowAccessEvaluationContext<TRecord>;
}): Promise<Set<string>> => {
  if (policy.kind === 'denied') {
    return new Set();
  }

  if (policy.kind === 'open') {
    return new Set(records.map((record) => record.id));
  }

  return evaluateExpression({
    expression: policy.expression,
    records,
    context,
  });
};

const evaluateExpression = async <TRecord extends RowAccessRecord>({
  expression,
  records,
  context,
}: {
  expression: RowAccessExpression;
  records: TRecord[];
  context: RowAccessEvaluationContext<TRecord>;
}): Promise<Set<string>> => {
  switch (expression.kind) {
    case 'and':
      return intersect(
        await Promise.all(
          expression.operands.map((operand) =>
            evaluateExpression({ expression: operand, records, context }),
          ),
        ),
      );
    case 'or':
      return union(
        await Promise.all(
          expression.operands.map((operand) =>
            evaluateExpression({ expression: operand, records, context }),
          ),
        ),
      );
    case 'roleFilter':
      return new Set(
        records
          .filter((record) =>
            isRecordMatchingRLSRowLevelPermissionPredicate({
              record,
              filter: expression.recordFilter,
              flatObjectMetadata: expression.flatObjectMetadata,
              flatFieldMetadataMaps: context.flatFieldMetadataMaps,
            }),
          )
          .map((record) => record.id),
      );
    case 'recordShared':
      return matchingShareIds({
        expression,
        records,
        context,
        admits: (grant) =>
          expression.principalIds.includes(grant.principalId) &&
          expression.accessLevels.includes(
            grant.accessLevel as RecordShareAccessLevel,
          ),
      });
    case 'recordNotRestricted':
      return matchingShareIds({
        expression,
        records,
        context,
        admits: (grant) => grant.accessLevel !== RecordShareAccessLevel.NONE,
        invert: true,
      });
    case 'inheritedReadability': {
      if (isDefined(context.resolveRecordIdsReadableThroughParents)) {
        return context.resolveRecordIdsReadableThroughParents({ records });
      }

      return new Set(records.map((record) => record.id));
    }
    default:
      return new Set();
  }
};

const matchingShareIds = async <TRecord extends RowAccessRecord>({
  expression,
  records,
  context,
  admits,
  invert = false,
}: {
  expression: { objectMetadataId: string };
  records: TRecord[];
  context: RowAccessEvaluationContext<TRecord>;
  admits: (grant: RecordShareGrant) => boolean;
  invert?: boolean;
}): Promise<Set<string>> => {
  const recordIds = records.map((record) => record.id);
  const grants = await context.fetchRecordShares({
    objectMetadataId: expression.objectMetadataId,
    recordIds,
  });
  const matched = new Set(grants.filter(admits).map((grant) => grant.recordId));

  if (!invert) {
    return new Set(recordIds.filter((recordId) => matched.has(recordId)));
  }

  const restricted = new Set(
    grants.filter((grant) => !admits(grant)).map((grant) => grant.recordId),
  );

  return new Set(recordIds.filter((recordId) => !restricted.has(recordId)));
};

const intersect = (sets: Set<string>[]): Set<string> => {
  if (sets.length === 0) {
    return new Set();
  }

  const [first, ...rest] = sets;

  return new Set(
    [...first].filter((id) => rest.every((candidate) => candidate.has(id))),
  );
};

const union = (sets: Set<string>[]): Set<string> => {
  const result = new Set<string>();

  for (const ids of sets) {
    for (const id of ids) {
      result.add(id);
    }
  }

  return result;
};
