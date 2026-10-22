import { EVERYONE_PRINCIPAL_ID } from 'twenty-shared/constants';
import {
  RecordShareAccessLevel,
  RecordSharePrincipalType,
} from 'twenty-shared/types';

import { type RecordSharingMode } from 'src/engine/core-modules/record-share/enums/record-sharing-mode.enum';
import { resolveDefaultGeneralAccessLevel } from 'src/engine/core-modules/record-share/utils/resolve-default-general-access-level.util';

type GeneralAccessShare = {
  principalId: string;
  principalType: RecordSharePrincipalType;
  accessLevel: RecordShareAccessLevel;
};

export const resolveRecordGeneralAccessLevel = ({
  sharingMode,
  recordShares,
}: {
  sharingMode: RecordSharingMode;
  recordShares: GeneralAccessShare[];
}): RecordShareAccessLevel => {
  const everyoneShare = recordShares.find(
    (share) =>
      share.principalType === RecordSharePrincipalType.EVERYONE ||
      share.principalId === EVERYONE_PRINCIPAL_ID,
  );

  return (
    everyoneShare?.accessLevel ?? resolveDefaultGeneralAccessLevel(sharingMode)
  );
};
