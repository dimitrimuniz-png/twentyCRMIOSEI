import { RecordShareAccessLevel } from 'twenty-shared/types';

import { RecordSharingMode } from 'src/engine/core-modules/record-share/enums/record-sharing-mode.enum';

// A record open by default is editable by the workspace until a row lowers it.
export const resolveDefaultGeneralAccessLevel = (
  sharingMode: RecordSharingMode,
): RecordShareAccessLevel =>
  sharingMode === RecordSharingMode.OPEN_BY_DEFAULT
    ? RecordShareAccessLevel.READ_WRITE
    : RecordShareAccessLevel.NONE;
