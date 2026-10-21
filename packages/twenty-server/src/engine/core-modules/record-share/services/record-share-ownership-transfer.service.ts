import { Injectable } from '@nestjs/common';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  RecordShareAccessLevel,
  RecordSharePrincipalType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { escapeIdentifier } from 'src/engine/workspace-manager/workspace-migration/utils/remove-sql-injection.util';

const quoted = (identifier: string): string => escapeIdentifier(identifier);

const HANDOVER_ACCESS_LEVELS = [
  RecordShareAccessLevel.READ_WRITE,
  RecordShareAccessLevel.FULL,
];

@Injectable()
export class RecordShareOwnershipTransferService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly userRoleService: UserRoleService,
  ) {}

  // A departing member's manageable grants move to the custodian. Read-only
  // grants are dropped. Chat threads stay, because their history is removed
  // with the member rather than reassigned.
  async transferRecordSharesToCustodian({
    removedUserWorkspace,
    removedWorkspaceMemberId,
    actingUserWorkspaceId,
  }: {
    removedUserWorkspace: UserWorkspaceEntity;
    removedWorkspaceMemberId: string;
    actingUserWorkspaceId?: string;
  }): Promise<void> {
    const custodianUserWorkspace =
      await this.userRoleService.resolveCustodianUserWorkspace({
        removedUserWorkspace,
        actingUserWorkspaceId,
      });

    if (!isDefined(custodianUserWorkspace)) {
      return;
    }

    const workspaceId = removedUserWorkspace.workspaceId;
    const custodianWorkspaceMemberId = await this.findWorkspaceMemberId({
      workspaceId,
      userId: custodianUserWorkspace.userId,
    });

    if (
      !isDefined(custodianWorkspaceMemberId) ||
      custodianWorkspaceMemberId === removedWorkspaceMemberId
    ) {
      return;
    }

    const chatThreadObjectMetadataId =
      await this.findChatThreadObjectMetadataId(workspaceId);
    const schema = quoted(getWorkspaceSchemaName(workspaceId));
    const recordShare = `${schema}.${quoted('recordShare')}`;
    const keepChatThread = isDefined(chatThreadObjectMetadataId)
      ? `AND ${quoted('objectMetadataId')} <> $3::uuid`
      : '';
    const handoverAccessLevelParameter = isDefined(chatThreadObjectMetadataId)
      ? '$4'
      : '$3';
    const insertParameters = [
      removedWorkspaceMemberId,
      custodianWorkspaceMemberId,
      ...(isDefined(chatThreadObjectMetadataId)
        ? [chatThreadObjectMetadataId]
        : []),
      HANDOVER_ACCESS_LEVELS,
    ];
    const deleteParameters = [
      removedWorkspaceMemberId,
      ...(isDefined(chatThreadObjectMetadataId)
        ? [chatThreadObjectMetadataId]
        : []),
    ];
    const deleteChatThread = isDefined(chatThreadObjectMetadataId)
      ? `AND ${quoted('objectMetadataId')} <> $2::uuid`
      : '';

    await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
          await scope.executeRawQuery(
            `INSERT INTO ${recordShare} (
               ${quoted('objectMetadataId')}, ${quoted('recordId')}, ${quoted('principalId')},
               ${quoted('principalType')}, ${quoted('accessLevel')}, ${quoted('rowCause')}, ${quoted('sourceId')}
             )
             SELECT ${quoted('objectMetadataId')}, ${quoted('recordId')}, $2::uuid,
                    ${quoted('principalType')}, ${quoted('accessLevel')}, ${quoted('rowCause')}, ${quoted('sourceId')}
             FROM ${recordShare}
             WHERE ${quoted('principalId')} = $1::uuid
               AND ${quoted('principalType')} = '${RecordSharePrincipalType.WORKSPACE_MEMBER}'
               AND ${quoted('accessLevel')} = ANY(${handoverAccessLevelParameter}::text[])
               ${keepChatThread}
             ON CONFLICT (${quoted('objectMetadataId')}, ${quoted('recordId')}, ${quoted('principalId')}, ${quoted('rowCause')}, ${quoted('sourceId')})
             DO UPDATE SET
               ${quoted('accessLevel')} = CASE
                 WHEN EXCLUDED.${quoted('accessLevel')} = '${RecordShareAccessLevel.FULL}'
                   OR ${quoted('recordShare')}.${quoted('accessLevel')} = '${RecordShareAccessLevel.FULL}'
                   THEN '${RecordShareAccessLevel.FULL}'
                 ELSE '${RecordShareAccessLevel.READ_WRITE}'
               END,
               ${quoted('updatedAt')} = now()`,
            insertParameters,
          );
          await scope.executeRawQuery(
            `DELETE FROM ${recordShare}
             WHERE ${quoted('principalId')} = $1::uuid
               AND ${quoted('principalType')} = '${RecordSharePrincipalType.WORKSPACE_MEMBER}'
               ${deleteChatThread}`,
            deleteParameters,
          );
        }),
      buildSystemAuthContext(workspaceId),
    );
  }

  private async findWorkspaceMemberId({
    workspaceId,
    userId,
  }: {
    workspaceId: string;
    userId: string;
  }): Promise<string | undefined> {
    const schema = quoted(getWorkspaceSchemaName(workspaceId));
    const rows = await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager.runInWorkspaceTransaction((scope) =>
          scope.executeRawQuery(
            `SELECT ${quoted('id')}
             FROM ${schema}.${quoted('workspaceMember')}
             WHERE ${quoted('userId')} = $1
               AND ${quoted('deletedAt')} IS NULL
             LIMIT 1`,
            [userId],
          ),
        ),
      buildSystemAuthContext(workspaceId),
    );
    const id = rows[0]?.id;

    return typeof id === 'string' ? id : undefined;
  }

  private async findChatThreadObjectMetadataId(
    workspaceId: string,
  ): Promise<string | undefined> {
    const { flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
      ]);

    return flatObjectMetadataMaps.byUniversalIdentifier[
      STANDARD_OBJECTS.agentChatThread.universalIdentifier
    ]?.id;
  }
}
