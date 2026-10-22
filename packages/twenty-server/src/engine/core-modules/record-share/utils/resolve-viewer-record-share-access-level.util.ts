import {
  RecordShareAccessLevel,
  type RecordSharePrincipalType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const ACCESS_RANK: Record<RecordShareAccessLevel, number> = {
  [RecordShareAccessLevel.NONE]: 0,
  [RecordShareAccessLevel.READ]: 1,
  [RecordShareAccessLevel.READ_WRITE]: 2,
  [RecordShareAccessLevel.FULL]: 3,
};

type RecordShareAccessCandidate = {
  principalId: string;
  principalType?: RecordSharePrincipalType;
  accessLevel: RecordShareAccessLevel;
};

// The viewer's access is the strongest grant that names them, including the
// general access and the creator's implicit ownership passed in separately.
export const resolveViewerRecordShareAccessLevel = ({
  recordShares,
  principalIds,
  implicitAccessLevels,
}: {
  recordShares: RecordShareAccessCandidate[];
  principalIds: string[];
  implicitAccessLevels: Array<RecordShareAccessLevel | null>;
}): RecordShareAccessLevel | null => {
  const principalIdSet = new Set(principalIds);
  const levels = [
    ...implicitAccessLevels,
    ...recordShares
      .filter((share) => principalIdSet.has(share.principalId))
      .map((share) => share.accessLevel),
  ].filter(
    (level): level is RecordShareAccessLevel =>
      isDefined(level) && level in ACCESS_RANK,
  );

  if (levels.length === 0) {
    return null;
  }

  return levels.reduce((best, level) =>
    ACCESS_RANK[level] > ACCESS_RANK[best] ? level : best,
  );
};
