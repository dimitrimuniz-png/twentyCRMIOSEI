import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { RecordSharePrincipalType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import {
  RecordShareException,
  RecordShareExceptionCode,
} from 'src/engine/core-modules/record-share/record-share.exception';
import { buildRowLevelPermissionRecordFilter } from 'src/engine/twenty-orm/utils/build-row-level-permission-record-filter.util';
import { isObjectOperationPermitted } from 'src/engine/twenty-orm/utils/is-object-operation-permitted.util';
import { isRecordMatchingRLSRowLevelPermissionPredicate } from 'src/engine/twenty-orm/utils/is-record-matching-rls-row-level-permission-predicate.util';
import { type WorkspaceTransactionScope } from 'src/engine/twenty-orm/types/workspace-transaction-scope.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

type ReachPrincipal = {
  principalId: string;
  principalType: RecordSharePrincipalType;
};

@Injectable()
export class RecordSharePrincipalService {
  constructor(private readonly workspaceCacheService: WorkspaceCacheService) {}

  async resolveRoleIds({
    workspaceId,
    principals,
  }: {
    workspaceId: string;
    principals: Array<{
      principalId: string;
      principalType: RecordSharePrincipalType;
    }>;
  }): Promise<Array<string | null>> {
    const { flatWorkspaceMemberMaps, userWorkspaceRoleMap } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatWorkspaceMemberMaps',
        'userWorkspaceRoleMap',
      ]);

    return principals.map((principal) => {
      if (
        principal.principalType !== RecordSharePrincipalType.WORKSPACE_MEMBER
      ) {
        return null;
      }

      const member = flatWorkspaceMemberMaps.byId[principal.principalId];
      const userWorkspaceId = isDefined(member)
        ? flatWorkspaceMemberMaps.userWorkspaceIdByUserId[member.userId]
        : undefined;

      if (!isDefined(userWorkspaceId)) {
        return null;
      }

      return userWorkspaceRoleMap[userWorkspaceId] ?? null;
    });
  }

  // A workspace-wide share may name someone the object role cannot read.
  // Role-only reach still has to see the object, and a member share also has
  // to survive that member's row filter. A role share does not: each member
  // is filtered again when they read.
  async assertPrincipalsReachRecordsOrThrow({
    workspaceId,
    transactionScope,
    flatObjectMetadata,
    canShareBeyondRole,
    principals,
    recordIds,
  }: {
    workspaceId: string;
    principals: ReachPrincipal[];
    recordIds: string[];
    transactionScope?: WorkspaceTransactionScope;
    flatObjectMetadata?: FlatObjectMetadata;
    canShareBeyondRole?: boolean;
  }): Promise<void> {
    if (canShareBeyondRole === true || !isDefined(flatObjectMetadata)) {
      return;
    }

    const {
      rolesPermissions,
      flatRowLevelPermissionPredicateMaps,
      flatRowLevelPermissionPredicateGroupMaps,
      flatFieldMetadataMaps,
      flatObjectMetadataMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'rolesPermissions',
      'flatRowLevelPermissionPredicateMaps',
      'flatRowLevelPermissionPredicateGroupMaps',
      'flatFieldMetadataMaps',
      'flatObjectMetadataMaps',
    ]);
    const roleIds = await this.resolveRoleIds({ workspaceId, principals });

    for (const [index, principal] of principals.entries()) {
      const roleId =
        principal.principalType === RecordSharePrincipalType.ROLE
          ? principal.principalId
          : roleIds[index];
      const objectsPermissions = isDefined(roleId)
        ? rolesPermissions[roleId]
        : undefined;

      if (
        !isDefined(objectsPermissions) ||
        !isObjectOperationPermitted({
          objectMetadata: flatObjectMetadata,
          operationType: 'select',
          objectsPermissions,
        })
      ) {
        throw new RecordShareException(
          `Principal ${principal.principalId} cannot read this object`,
          RecordShareExceptionCode.INVALID_SHARE_WITH,
          {
            userFriendlyMessage: msg`Choose someone who can already see this record.`,
          },
        );
      }

      if (
        principal.principalType !== RecordSharePrincipalType.WORKSPACE_MEMBER ||
        !isDefined(roleId)
      ) {
        continue;
      }

      const recordFilter = buildRowLevelPermissionRecordFilter({
        roleIds: [roleId],
        objectMetadata: flatObjectMetadata,
        flatRowLevelPermissionPredicateMaps,
        flatRowLevelPermissionPredicateGroupMaps,
        flatFieldMetadataMaps,
        flatObjectMetadataMaps,
      });

      if (!isDefined(recordFilter)) {
        continue;
      }

      if (!isDefined(transactionScope)) {
        throw new RecordShareException(
          `Principal ${principal.principalId} cannot be checked against the row filter`,
          RecordShareExceptionCode.INVALID_SHARE_WITH,
          {
            userFriendlyMessage: msg`Choose someone who can already see this record.`,
          },
        );
      }

      const records = [];

      for (const recordId of recordIds) {
        const [record] = await transactionScope
          .getRepository(flatObjectMetadata.nameSingular, {
            shouldBypassPermissionChecks: true,
          })
          .find({ where: { id: recordId } });

        records.push(record);
      }

      for (const [recordIndex, recordId] of recordIds.entries()) {
        const record = records[recordIndex];

        if (
          !isDefined(record) ||
          !isRecordMatchingRLSRowLevelPermissionPredicate({
            record,
            filter: recordFilter,
            flatObjectMetadata,
            flatFieldMetadataMaps,
          })
        ) {
          throw new RecordShareException(
            `Principal ${principal.principalId} cannot see record ${recordId}`,
            RecordShareExceptionCode.INVALID_SHARE_WITH,
            {
              userFriendlyMessage: msg`Choose someone who can already see this record.`,
            },
          );
        }
      }
    }
  }
}
