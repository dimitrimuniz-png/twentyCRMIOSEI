import {
  FeatureFlagKey,
  MetadataReadability,
  ObjectSharingReach,
} from 'twenty-shared/types';

import { RecordSharingMode } from 'src/engine/core-modules/record-share/enums/record-sharing-mode.enum';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type OperationType } from 'src/engine/twenty-orm/repository/permissions.utils';

export type ObjectSharing = {
  sharingMode: RecordSharingMode;
  operationTypesGrantedBeyondRole: OperationType[];
};

export const resolveObjectSharing = ({
  flatObjectMetadata,
  featureFlagsMap,
}: {
  flatObjectMetadata: Pick<
    FlatObjectMetadata,
    'readability' | 'isSystem' | 'sharingReach'
  >;
  featureFlagsMap?: Partial<Record<FeatureFlagKey, boolean>>;
}): ObjectSharing => {
  const sharingEnabled =
    featureFlagsMap?.[FeatureFlagKey.IS_RECORD_LEVEL_SHARING_ENABLED] === true;
  const sharingReach =
    flatObjectMetadata.sharingReach ?? ObjectSharingReach.WORKSPACE;

  const sharingMode = resolveSharingMode({
    readability: flatObjectMetadata.readability,
    isSystem: flatObjectMetadata.isSystem,
    sharingEnabled,
  });

  const grantsNamedRecords =
    sharingMode === RecordSharingMode.OPEN_BY_DEFAULT &&
    sharingReach === ObjectSharingReach.WORKSPACE;

  return {
    sharingMode,
    operationTypesGrantedBeyondRole: grantsNamedRecords
      ? ['select', 'update']
      : [],
  };
};

const resolveSharingMode = ({
  readability,
  isSystem,
  sharingEnabled,
}: {
  readability: MetadataReadability | undefined;
  isSystem: boolean | undefined;
  sharingEnabled: boolean;
}): RecordSharingMode => {
  if (readability === MetadataReadability.PRIVATE) {
    return RecordSharingMode.PRIVATE;
  }

  if (readability === MetadataReadability.INHERITED) {
    return RecordSharingMode.INHERITED;
  }

  if (
    readability === MetadataReadability.APPLICATION ||
    readability === MetadataReadability.SYSTEM ||
    isSystem === true ||
    !sharingEnabled
  ) {
    return RecordSharingMode.ROLE_ONLY;
  }

  return RecordSharingMode.OPEN_BY_DEFAULT;
};
