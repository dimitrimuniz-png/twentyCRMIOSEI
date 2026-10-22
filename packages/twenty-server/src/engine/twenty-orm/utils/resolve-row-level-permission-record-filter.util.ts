import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';
import { type RolePermissionConfig } from 'src/engine/twenty-orm/types/role-permission-config.type';
import { buildRowLevelPermissionRecordFilter } from 'src/engine/twenty-orm/utils/build-row-level-permission-record-filter.util';
import { getRoleIdsFromRolePermissionConfig } from 'src/engine/twenty-orm/utils/get-role-ids-from-role-permission-config.util';

export const resolveRowLevelPermissionRecordFilter = ({
  internalContext,
  authContext,
  rolePermissionConfig,
  objectMetadata,
}: {
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext | undefined;
  rolePermissionConfig: RolePermissionConfig;
  objectMetadata: FlatObjectMetadata;
}): RecordGqlOperationFilter | null => {
  const recordFilter = buildRowLevelPermissionRecordFilter({
    flatRowLevelPermissionPredicateMaps:
      internalContext.flatRowLevelPermissionPredicateMaps,
    flatRowLevelPermissionPredicateGroupMaps:
      internalContext.flatRowLevelPermissionPredicateGroupMaps,
    flatFieldMetadataMaps:
      internalContext.flatFieldMetadataMaps as FlatEntityMaps<FlatFieldMetadata>,
    flatObjectMetadataMaps: internalContext.flatObjectMetadataMaps,
    objectMetadata,
    roleIds: getRoleIdsFromRolePermissionConfig(rolePermissionConfig),
    workspaceMember:
      authContext?.type === 'user' ? authContext.workspaceMember : undefined,
  });

  return isDefined(recordFilter) && Object.keys(recordFilter).length > 0
    ? recordFilter
    : null;
};
