import { MetadataReadability } from 'twenty-shared/types';

export type RecordShareGateKind = 'deny' | 'private' | 'open';

// SYSTEM and APPLICATION rows stay invisible unless the caller owns them.
// PRIVATE is a share gate, not a hard deny.
export const resolveRecordShareGateKind = ({
  readability,
  isOwningApplication,
}: {
  readability: MetadataReadability | null | undefined;
  isOwningApplication: boolean;
}): RecordShareGateKind => {
  if (
    (readability === MetadataReadability.SYSTEM ||
      readability === MetadataReadability.APPLICATION) &&
    !isOwningApplication
  ) {
    return 'deny';
  }

  if (readability === MetadataReadability.PRIVATE) {
    return 'private';
  }

  return 'open';
};
