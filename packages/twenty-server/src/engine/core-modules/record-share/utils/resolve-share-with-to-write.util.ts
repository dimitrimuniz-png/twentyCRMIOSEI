import { isNonEmptyArray } from 'twenty-shared/utils';

import { RecordSharingMode } from 'src/engine/core-modules/record-share/enums/record-sharing-mode.enum';
import { type ShareWithInput } from 'src/engine/core-modules/record-share/types/share-with-input.type';

export const resolveShareWithToWrite = ({
  sharingMode,
  shareWith,
}: {
  sharingMode: RecordSharingMode;
  shareWith?: ShareWithInput[];
}): ShareWithInput[] | undefined => {
  if (
    sharingMode === RecordSharingMode.PRIVATE ||
    sharingMode === RecordSharingMode.INHERITED
  ) {
    return shareWith ?? [];
  }

  return isNonEmptyArray(shareWith) ? shareWith : undefined;
};
