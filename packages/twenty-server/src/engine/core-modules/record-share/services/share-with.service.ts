import { Injectable } from '@nestjs/common';

import {
  RecordShareAccessLevel,
  RecordSharePrincipalType,
  RecordShareRowCause,
} from 'twenty-shared/types';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type ObjectSharing } from 'src/engine/core-modules/record-share/utils/resolve-object-sharing.util';
import { RecordShareStorageService } from 'src/engine/core-modules/record-share/services/record-share-storage.service';
import { type RecordShareInput } from 'src/engine/core-modules/record-share/types/record-share-input.type';
import { type ShareWithInput } from 'src/engine/core-modules/record-share/types/share-with-input.type';
import { validateShareWithPrincipalsOrThrow } from 'src/engine/core-modules/record-share/utils/validate-share-with-principals-or-throw.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type WorkspaceTransactionScope } from 'src/engine/twenty-orm/types/workspace-transaction-scope.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
export class ShareWithService {
  constructor(
    private readonly recordShareStorageService: RecordShareStorageService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async validateShareWithOrThrow({
    authContext,
    shareWith,
  }: {
    authContext: WorkspaceAuthContext;
    shareWith?: ShareWithInput[];
  }): Promise<void> {
    if (!isNonEmptyArray(shareWith)) {
      return;
    }

    const { flatWorkspaceMemberMaps, flatRoleMaps } =
      await this.workspaceCacheService.getOrRecompute(
        authContext.workspace.id,
        ['flatWorkspaceMemberMaps', 'flatRoleMaps'],
      );

    validateShareWithPrincipalsOrThrow({
      shareWith,
      flatWorkspaceMemberMaps,
      flatRoleMaps,
    });
  }

  async insertRecordSharesForCreatedRecords({
    authContext,
    flatObjectMetadata,
    recordIds,
    shareWith,
    transactionScope,
  }: {
    authContext: WorkspaceAuthContext;
    flatObjectMetadata: FlatObjectMetadata;
    objectSharing: ObjectSharing;
    recordIds: string[];
    apiKeyRoleMap?: unknown;
    shareWith: ShareWithInput[];
    transactionScope: WorkspaceTransactionScope;
  }): Promise<void> {
    const recordShares: RecordShareInput[] = [];

    if (isUserAuthContext(authContext)) {
      for (const recordId of recordIds) {
        recordShares.push({
          recordId,
          objectMetadataId: flatObjectMetadata.id,
          principalId: authContext.workspaceMemberId,
          principalType: RecordSharePrincipalType.WORKSPACE_MEMBER,
          accessLevel: RecordShareAccessLevel.FULL,
          rowCause: RecordShareRowCause.OWNER,
          sourceId: recordId,
        });
      }
    }

    if (isNonEmptyArray(shareWith)) {
      const { flatWorkspaceMemberMaps, flatRoleMaps } =
        await this.workspaceCacheService.getOrRecompute(
          authContext.workspace.id,
          ['flatWorkspaceMemberMaps', 'flatRoleMaps'],
        );
      const principals = validateShareWithPrincipalsOrThrow({
        shareWith,
        flatWorkspaceMemberMaps,
        flatRoleMaps,
      });

      for (const recordId of recordIds) {
        for (const principal of principals) {
          if (principal.principalType === RecordSharePrincipalType.EVERYONE) {
            continue;
          }

          recordShares.push({
            recordId,
            objectMetadataId: flatObjectMetadata.id,
            principalId: principal.principalId,
            principalType: principal.principalType,
            accessLevel: principal.accessLevel,
            rowCause: RecordShareRowCause.MANUAL,
            sourceId: recordId,
          });
        }
      }
    }

    if (!isDefined(recordShares[0])) {
      return;
    }

    await this.recordShareStorageService.insertMany({
      workspaceId: authContext.workspace.id,
      recordShares,
      transactionScope,
    });
  }
}
