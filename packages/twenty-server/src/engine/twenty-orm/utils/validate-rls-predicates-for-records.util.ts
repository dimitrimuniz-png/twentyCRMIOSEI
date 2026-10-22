import { type ObjectRecord } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';
import { type RolePermissionConfig } from 'src/engine/twenty-orm/types/role-permission-config.type';
import { isRecordMatchingRLSRowLevelPermissionPredicate } from 'src/engine/twenty-orm/utils/is-record-matching-rls-row-level-permission-predicate.util';
import { resolveRowLevelPermissionRecordFilter } from 'src/engine/twenty-orm/utils/resolve-row-level-permission-record-filter.util';

export const validateRLSPredicatesForRecords = ({
  records,
  objectMetadata,
  internalContext,
  authContext,
  rolePermissionConfig,
  shouldBypassPermissionChecks,
}: {
  records: ObjectRecord[];
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext | undefined;
  rolePermissionConfig: RolePermissionConfig;
  shouldBypassPermissionChecks?: boolean;
}): void => {
  if (shouldBypassPermissionChecks === true) {
    return;
  }

  const recordFilter = resolveRowLevelPermissionRecordFilter({
    internalContext,
    authContext,
    rolePermissionConfig,
    objectMetadata,
  });

  if (!isDefined(recordFilter)) {
    return;
  }

  const deniedRecord = records.find(
    (record) =>
      !isRecordMatchingRLSRowLevelPermissionPredicate({
        record,
        filter: recordFilter,
        flatObjectMetadata: objectMetadata,
        flatFieldMetadataMaps: internalContext.flatFieldMetadataMaps,
      }),
  );

  if (isDefined(deniedRecord)) {
    throw new PermissionsException(
      PermissionsExceptionMessage.PERMISSION_DENIED,
      PermissionsExceptionCode.PERMISSION_DENIED,
    );
  }
};
