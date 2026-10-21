import { randomBytes } from 'crypto';

import { RecordShareAccessLevel } from 'twenty-shared/types';

import { type SqlCondition } from 'src/engine/twenty-orm/types/row-access-policy.type';

// A restriction is a share row that removes the record from the open set.
// It is matched by access level, never by row cause, so private grants and
// open restrictions stay distinguishable.
export const buildRecordShareExceptionCondition = ({
  tableAlias,
  objectMetadataId,
  recordShareTableExpression,
}: {
  tableAlias: string;
  objectMetadataId: string;
  principalIds?: string[];
  accessLevels?: RecordShareAccessLevel[];
  recordShareTableExpression: string;
}): SqlCondition => {
  const shareAlias = `recordShareRestriction_${randomBytes(5).toString('hex')}`;
  const objectKey = `recordShareObject${randomBytes(5).toString('hex')}`;

  return {
    sql: `NOT EXISTS (SELECT 1 FROM ${recordShareTableExpression} AS "${shareAlias}" WHERE "${shareAlias}"."recordId" = "${tableAlias}"."id" AND "${shareAlias}"."objectMetadataId" = :${objectKey} AND "${shareAlias}"."accessLevel" = '${RecordShareAccessLevel.NONE}' AND "${shareAlias}"."deletedAt" IS NULL)`,
    parameters: { [objectKey]: objectMetadataId },
  };
};
