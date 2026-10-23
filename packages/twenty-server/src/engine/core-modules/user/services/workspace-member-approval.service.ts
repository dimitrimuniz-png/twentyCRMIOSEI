import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { PermissionFlagType } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';
import { type Repository } from 'typeorm';

import { CoreEntityCacheService } from 'src/engine/core-entity-cache/services/core-entity-cache.service';
import {
  type MemberApprovalAssignableRoleDTO,
  type PendingWorkspaceMemberDTO,
} from 'src/engine/core-modules/user/dtos/workspace-member-approval.dto';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { WorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/enums/workspace-member-approval-status.enum';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
export class WorkspaceMemberApprovalService {
  constructor(
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly permissionsService: PermissionsService,
    private readonly userRoleService: UserRoleService,
    private readonly userService: UserService,
    private readonly coreEntityCacheService: CoreEntityCacheService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async listPendingMembers({
    workspaceId,
    actingUserWorkspaceId,
    apiKeyId,
    applicationId,
    agentId,
  }: {
    workspaceId: string;
    actingUserWorkspaceId: string | undefined;
    apiKeyId?: string;
    applicationId: string | undefined;
    agentId: string | undefined;
  }): Promise<PendingWorkspaceMemberDTO[]> {
    await this.assertCanReviewMembers({
      workspaceId,
      actingUserWorkspaceId,
      apiKeyId,
      applicationId,
      agentId,
    });

    const pendingUserWorkspaces = await this.userWorkspaceRepository.find({
      where: {
        workspaceId,
        approvalStatus: WorkspaceMemberApprovalStatus.PENDING,
      },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    return pendingUserWorkspaces.flatMap((userWorkspace) => {
      if (!isDefined(userWorkspace.user)) {
        return [];
      }

      return [
        {
          userWorkspaceId: userWorkspace.id,
          email: userWorkspace.user.email,
          firstName: userWorkspace.user.firstName ?? null,
          lastName: userWorkspace.user.lastName ?? null,
          createdAt: userWorkspace.createdAt,
        },
      ];
    });
  }

  async listAssignableRoles({
    workspaceId,
    actingUserWorkspaceId,
    apiKeyId,
    applicationId,
    agentId,
  }: {
    workspaceId: string;
    actingUserWorkspaceId: string | undefined;
    apiKeyId?: string;
    applicationId: string | undefined;
    agentId: string | undefined;
  }): Promise<MemberApprovalAssignableRoleDTO[]> {
    await this.assertCanReviewMembers({
      workspaceId,
      actingUserWorkspaceId,
      apiKeyId,
      applicationId,
      agentId,
    });

    const { flatRoleMaps } = await this.workspaceCacheService.getOrRecompute(
      workspaceId,
      ['flatRoleMaps'],
    );

    return Object.values(flatRoleMaps.byUniversalIdentifier)
      .filter(isDefined)
      .filter((flatRole) => flatRole.canBeAssignedToUsers)
      .map((flatRole) => ({
        id: flatRole.id,
        label: flatRole.label,
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }

  async approvePendingMember({
    workspaceId,
    userWorkspaceId,
    roleId,
    actingUserWorkspaceId,
    apiKeyId,
    applicationId,
    agentId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
    roleId: string;
    actingUserWorkspaceId: string;
    apiKeyId?: string;
    applicationId: string | undefined;
    agentId: string | undefined;
  }): Promise<boolean> {
    await this.assertCanReviewMembers({
      workspaceId,
      actingUserWorkspaceId,
      apiKeyId,
      applicationId,
      agentId,
    });

    const userWorkspace = await this.findPendingUserWorkspaceOrThrow({
      workspaceId,
      userWorkspaceId,
    });

    await this.userRoleService.assignRoleToManyUserWorkspace({
      workspaceId,
      userWorkspaceIds: [userWorkspace.id],
      roleId,
      actingUserWorkspaceId,
    });

    await this.userWorkspaceRepository.update(userWorkspace.id, {
      approvalStatus: WorkspaceMemberApprovalStatus.APPROVED,
    });

    await this.coreEntityCacheService.invalidate(
      'userWorkspaceEntity',
      userWorkspace.id,
    );

    return true;
  }

  async rejectPendingMember({
    workspaceId,
    userWorkspaceId,
    actingUserWorkspaceId,
    apiKeyId,
    applicationId,
    agentId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
    actingUserWorkspaceId: string;
    apiKeyId?: string;
    applicationId: string | undefined;
    agentId: string | undefined;
  }): Promise<boolean> {
    await this.assertCanReviewMembers({
      workspaceId,
      actingUserWorkspaceId,
      apiKeyId,
      applicationId,
      agentId,
    });

    const userWorkspace = await this.findPendingUserWorkspaceOrThrow({
      workspaceId,
      userWorkspaceId,
    });

    const memberCount = await this.userWorkspaceRepository.count({
      where: { workspaceId },
    });

    if (memberCount <= 1) {
      throw new PermissionsException(
        'Cannot reject the only workspace member',
        PermissionsExceptionCode.PERMISSION_DENIED,
        {
          userFriendlyMessage: msg`The only workspace member cannot be rejected.`,
        },
      );
    }

    await this.userService.deleteUserWorkspaceAndPotentiallyDeleteUser({
      userId: userWorkspace.userId,
      workspaceId,
      actingUserWorkspaceId,
    });

    return true;
  }

  private async findPendingUserWorkspaceOrThrow({
    workspaceId,
    userWorkspaceId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
  }): Promise<UserWorkspaceEntity> {
    const userWorkspace = await this.userWorkspaceRepository.findOne({
      where: { id: userWorkspaceId, workspaceId },
    });

    if (
      !isDefined(userWorkspace) ||
      userWorkspace.approvalStatus !== WorkspaceMemberApprovalStatus.PENDING
    ) {
      throw new PermissionsException(
        'Pending workspace member not found',
        PermissionsExceptionCode.PERMISSION_DENIED,
        {
          userFriendlyMessage: msg`This person is not waiting for approval.`,
        },
      );
    }

    return userWorkspace;
  }

  private async assertCanReviewMembers({
    workspaceId,
    actingUserWorkspaceId,
    apiKeyId,
    applicationId,
    agentId,
  }: {
    workspaceId: string;
    actingUserWorkspaceId: string | undefined;
    apiKeyId?: string;
    applicationId: string | undefined;
    agentId: string | undefined;
  }): Promise<void> {
    const permissionArguments = {
      userWorkspaceId: actingUserWorkspaceId,
      workspaceId,
      apiKeyId,
      applicationId,
      agentId,
    };

    const canManageMembers =
      await this.permissionsService.userHasWorkspaceSettingPermission({
        ...permissionArguments,
        setting: PermissionFlagType.WORKSPACE_MEMBERS,
      });

    if (canManageMembers) {
      return;
    }

    const canManageRoles =
      await this.permissionsService.userHasWorkspaceSettingPermission({
        ...permissionArguments,
        setting: PermissionFlagType.ROLES,
      });

    if (canManageRoles) {
      return;
    }

    throw new PermissionsException(
      PermissionsExceptionMessage.PERMISSION_DENIED,
      PermissionsExceptionCode.PERMISSION_DENIED,
      {
        userFriendlyMessage: msg`You do not have permission to review workspace members.`,
      },
    );
  }
}
