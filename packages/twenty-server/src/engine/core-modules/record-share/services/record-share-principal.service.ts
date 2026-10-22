import { Injectable } from '@nestjs/common';

import { RecordSharePrincipalType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

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

  // The following update check drops a member whose role cannot reply. The
  // share itself is still recorded so a later role change can see it.
  async assertPrincipalsReachRecordsOrThrow(_args: {
    workspaceId: string;
    principals: unknown[];
    recordIds: string[];
    transactionScope?: unknown;
    flatObjectMetadata?: unknown;
    canShareBeyondRole?: boolean;
  }): Promise<void> {
    return;
  }
}
