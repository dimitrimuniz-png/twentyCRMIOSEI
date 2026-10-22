import { randomBytes } from 'crypto';

import { EVERYONE_PRINCIPAL_ID } from 'twenty-shared/constants';
import { type RecordShareAccessLevel } from 'twenty-shared/types';

import { type SqlCondition } from 'src/engine/twenty-orm/types/row-access-policy.type';

// Admit a named grant at the operation's level, or the open default when no
// everyone row withholds that level. A READ everyone row still blocks writes.
export const buildRecordShareExceptionCondition = ({
  tableAlias,
  objectMetadataId,
  principalIds = [],
  accessLevels = [],
  recordShareTableExpression,
}: {
  tableAlias: string;
  objectMetadataId: string;
  principalIds?: string[];
  accessLevels?: RecordShareAccessLevel[];
  recordShareTableExpression: string;
}): SqlCondition => {
  const shareAlias = `recordShareRestriction_${randomBytes(5).toString('hex')}`;
  const everyoneAlias = `recordShareEveryone_${randomBytes(5).toString('hex')}`;
  const objectKey = `recordShareObject${randomBytes(5).toString('hex')}`;
  const principalKey = `recordSharePrincipals${randomBytes(5).toString('hex')}`;
  const accessKey = `recordShareAccess${randomBytes(5).toString('hex')}`;
  const everyoneKey = `recordShareEveryoneId${randomBytes(5).toString('hex')}`;
  const parameters: SqlCondition['parameters'] = {
    [objectKey]: objectMetadataId,
  };
  const admittedByPrincipal =
    principalIds.length > 0 && accessLevels.length > 0
      ? `EXISTS (SELECT 1 FROM ${recordShareTableExpression} AS "${shareAlias}" WHERE "${shareAlias}"."recordId" = "${tableAlias}"."id" AND "${shareAlias}"."objectMetadataId" = :${objectKey} AND "${shareAlias}"."deletedAt" IS NULL AND "${shareAlias}"."principalId" IN (:...${principalKey}) AND "${shareAlias}"."accessLevel" IN (:...${accessKey}))`
      : 'FALSE';

  if (principalIds.length > 0 && accessLevels.length > 0) {
    parameters[principalKey] = principalIds;
    parameters[accessKey] = accessLevels;
  }

  const everyoneDoesNotWithhold =
    accessLevels.length > 0
      ? `NOT EXISTS (SELECT 1 FROM ${recordShareTableExpression} AS "${everyoneAlias}" WHERE "${everyoneAlias}"."recordId" = "${tableAlias}"."id" AND "${everyoneAlias}"."objectMetadataId" = :${objectKey} AND "${everyoneAlias}"."deletedAt" IS NULL AND "${everyoneAlias}"."principalId" = :${everyoneKey} AND "${everyoneAlias}"."accessLevel" NOT IN (:...${accessKey}))`
      : 'FALSE';

  if (accessLevels.length > 0) {
    parameters[accessKey] = accessLevels;
    parameters[everyoneKey] = EVERYONE_PRINCIPAL_ID;
  }

  return {
    sql: `(${admittedByPrincipal} OR ${everyoneDoesNotWithhold})`,
    parameters,
  };
};
