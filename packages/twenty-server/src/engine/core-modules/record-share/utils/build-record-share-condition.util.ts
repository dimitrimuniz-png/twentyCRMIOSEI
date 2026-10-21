import { randomBytes } from 'crypto';

import { type RecordShareAccessLevel } from 'twenty-shared/types';

import { type SqlCondition } from 'src/engine/twenty-orm/types/row-access-policy.type';

export const buildRecordShareCondition = ({
  tableAlias,
  objectMetadataId,
  principalIds,
  accessLevels,
  recordShareTableExpression,
  isUncorrelated = false,
}: {
  tableAlias: string;
  objectMetadataId: string;
  principalIds: string[];
  accessLevels: RecordShareAccessLevel[];
  recordShareTableExpression: string;
  isUncorrelated?: boolean;
}): SqlCondition => {
  const shareAlias = `${tableAlias}_recordShare`;
  const objectKey = parameterKey('recordShareObject');
  const principalKey = parameterKey('recordSharePrincipals');
  const accessKey = parameterKey('recordShareAccess');
  const where = [
    `"${shareAlias}"."objectMetadataId" = :${objectKey}`,
    `"${shareAlias}"."principalId" IN (:...${principalKey})`,
    `"${shareAlias}"."accessLevel" IN (:...${accessKey})`,
    `"${shareAlias}"."deletedAt" IS NULL`,
  ].join(' AND ');
  const parameters = {
    [objectKey]: objectMetadataId,
    [principalKey]: principalIds,
    [accessKey]: accessLevels,
  };

  if (isUncorrelated) {
    return {
      sql: `"${tableAlias}"."id" = ANY(ARRAY(SELECT "${shareAlias}"."recordId" FROM ${recordShareTableExpression} AS "${shareAlias}" WHERE ${where}))`,
      parameters,
    };
  }

  return {
    sql: `EXISTS (SELECT 1 FROM ${recordShareTableExpression} AS "${shareAlias}" WHERE "${shareAlias}"."recordId" = "${tableAlias}"."id" AND ${where})`,
    parameters,
  };
};

const parameterKey = (prefix: string): string =>
  `${prefix}${randomBytes(5).toString('hex')}`;
