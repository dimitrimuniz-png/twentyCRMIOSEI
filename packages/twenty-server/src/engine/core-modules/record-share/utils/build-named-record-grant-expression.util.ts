import { EVERYONE_PRINCIPAL_ID } from 'twenty-shared/constants';
import { RecordShareAccessLevel } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import {
  type RowAccessExpression,
  type RowAccessPolicyContext,
  type RowAccessPolicyTarget,
} from 'src/engine/twenty-orm/types/row-access-policy.type';

const READ_ACCESS_LEVELS = [
  RecordShareAccessLevel.READ,
  RecordShareAccessLevel.READ_WRITE,
  RecordShareAccessLevel.FULL,
];

const WRITE_ACCESS_LEVELS = [
  RecordShareAccessLevel.READ_WRITE,
  RecordShareAccessLevel.FULL,
];

export const buildNamedRecordGrantExpression = (
  { subject }: RowAccessPolicyContext,
  { tableAlias, flatObjectMetadata, operationType }: RowAccessPolicyTarget,
): RowAccessExpression | undefined => {
  const principalIds = (subject.principalIds ?? []).filter(
    (principalId) => principalId !== EVERYONE_PRINCIPAL_ID,
  );

  if (principalIds.length === 0) {
    return undefined;
  }

  return {
    kind: 'recordShared',
    isUncorrelated: true,
    tableAlias,
    objectMetadataId: flatObjectMetadata.id,
    principalIds,
    accessLevels:
      operationType === 'select' ? READ_ACCESS_LEVELS : WRITE_ACCESS_LEVELS,
  };
};

export const isNamedRecordGrantDefined = (
  expression: RowAccessExpression | undefined,
): expression is RowAccessExpression => isDefined(expression);
