import { UseFilters, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { ApiKeyEntity } from 'src/engine/core-modules/api-key/api-key.entity';
import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { WorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/enums/workspace-member-approval-status.enum';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import {
  MemberApprovalAssignableRoleDTO,
  PendingWorkspaceMemberDTO,
  WorkspaceMemberApprovalDTO,
} from 'src/engine/core-modules/user/dtos/workspace-member-approval.dto';
import { WorkspaceMemberApprovalService } from 'src/engine/core-modules/user/services/workspace-member-approval.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AllowPendingWorkspaceMember } from 'src/engine/decorators/auth/allow-pending-workspace-member.decorator';
import { AllowSuspendedWorkspace } from 'src/engine/decorators/auth/allow-suspended-workspace.decorator';
import { AuthApiKey } from 'src/engine/decorators/auth/auth-api-key.decorator';
import { AuthApplication } from 'src/engine/decorators/auth/auth-application.decorator';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';
import { isDefined } from 'twenty-shared/utils';

@MetadataResolver()
@UseFilters(PermissionsGraphqlApiExceptionFilter, AuthGraphqlApiExceptionFilter)
@UseGuards(
  AuthPrincipalGuard({
    userSession: true,
    apiKey: false,
    oauthClient: { withUser: true, withoutUser: false },
    application: { withUser: true, withoutUser: false },
  }),
  NoPermissionGuard,
)
export class WorkspaceMemberApprovalResolver {
  constructor(
    private readonly workspaceMemberApprovalService: WorkspaceMemberApprovalService,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  @Query(() => WorkspaceMemberApprovalDTO)
  @AllowSuspendedWorkspace()
  @AllowPendingWorkspaceMember()
  async currentWorkspaceMemberApproval(
    @AuthWorkspace({ allowUndefined: true })
    workspace: WorkspaceEntity | undefined,
    @AuthUserWorkspaceId({ allowUndefined: true })
    userWorkspaceId: string | undefined,
  ): Promise<WorkspaceMemberApprovalDTO> {
    if (!isDefined(workspace) || !isDefined(userWorkspaceId)) {
      return {
        approvalStatus: WorkspaceMemberApprovalStatus.APPROVED,
        isMemberApprovalRequired: false,
      };
    }

    const userWorkspace = await this.userWorkspaceRepository.findOne({
      where: { id: userWorkspaceId, workspaceId: workspace.id },
    });

    return {
      approvalStatus:
        userWorkspace?.approvalStatus ?? WorkspaceMemberApprovalStatus.APPROVED,
      isMemberApprovalRequired: workspace.isMemberApprovalRequired === true,
    };
  }

  @Query(() => [PendingWorkspaceMemberDTO])
  @AllowSuspendedWorkspace()
  async pendingWorkspaceMembers(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actingUserWorkspaceId: string,
    @AuthApiKey() apiKey: ApiKeyEntity | undefined,
    @AuthApplication({ allowUndefined: true })
    application: FlatApplication | undefined,
  ): Promise<PendingWorkspaceMemberDTO[]> {
    return this.workspaceMemberApprovalService.listPendingMembers({
      workspaceId: workspace.id,
      actingUserWorkspaceId,
      apiKeyId: apiKey?.id,
      applicationId: application?.id,
      agentId: undefined,
    });
  }

  @Query(() => [MemberApprovalAssignableRoleDTO])
  @AllowSuspendedWorkspace()
  async memberApprovalAssignableRoles(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actingUserWorkspaceId: string,
    @AuthApiKey() apiKey: ApiKeyEntity | undefined,
    @AuthApplication({ allowUndefined: true })
    application: FlatApplication | undefined,
  ): Promise<MemberApprovalAssignableRoleDTO[]> {
    return this.workspaceMemberApprovalService.listAssignableRoles({
      workspaceId: workspace.id,
      actingUserWorkspaceId,
      apiKeyId: apiKey?.id,
      applicationId: application?.id,
      agentId: undefined,
    });
  }

  @Mutation(() => Boolean)
  @AllowSuspendedWorkspace()
  async approvePendingWorkspaceMember(
    @Args('userWorkspaceId', { type: () => UUIDScalarType })
    userWorkspaceId: string,
    @Args('roleId', { type: () => UUIDScalarType }) roleId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actingUserWorkspaceId: string,
    @AuthApiKey() apiKey: ApiKeyEntity | undefined,
    @AuthApplication({ allowUndefined: true })
    application: FlatApplication | undefined,
  ): Promise<boolean> {
    return this.workspaceMemberApprovalService.approvePendingMember({
      workspaceId: workspace.id,
      userWorkspaceId,
      roleId,
      actingUserWorkspaceId,
      apiKeyId: apiKey?.id,
      applicationId: application?.id,
      agentId: undefined,
    });
  }

  @Mutation(() => Boolean)
  @AllowSuspendedWorkspace()
  async rejectPendingWorkspaceMember(
    @Args('userWorkspaceId', { type: () => UUIDScalarType })
    userWorkspaceId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() actingUserWorkspaceId: string,
    @AuthApiKey() apiKey: ApiKeyEntity | undefined,
    @AuthApplication({ allowUndefined: true })
    application: FlatApplication | undefined,
  ): Promise<boolean> {
    return this.workspaceMemberApprovalService.rejectPendingMember({
      workspaceId: workspace.id,
      userWorkspaceId,
      actingUserWorkspaceId,
      apiKeyId: apiKey?.id,
      applicationId: application?.id,
      agentId: undefined,
    });
  }
}
