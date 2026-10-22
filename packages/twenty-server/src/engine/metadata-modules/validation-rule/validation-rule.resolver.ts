import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import {
  CreateValidationRuleInput,
  UpdateValidationRuleInput,
  ValidationRuleDTO,
} from 'src/engine/metadata-modules/validation-rule/dtos/validation-rule.dto';
import { ValidationRuleService } from 'src/engine/metadata-modules/validation-rule/validation-rule.service';

@MetadataResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: true,
    application: true,
  }),
  SettingsPermissionGuard(PermissionFlagType.DATA_MODEL),
)
export class ValidationRuleResolver {
  constructor(private readonly validationRuleService: ValidationRuleService) {}

  @Query(() => [ValidationRuleDTO])
  async validationRules(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('objectMetadataId', { type: () => UUIDScalarType })
    objectMetadataId: string,
  ): Promise<ValidationRuleDTO[]> {
    return this.validationRuleService.findByObject({
      workspaceId: workspace.id,
      objectMetadataId,
    });
  }

  @Mutation(() => ValidationRuleDTO)
  async createValidationRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CreateValidationRuleInput,
  ): Promise<ValidationRuleDTO> {
    return this.validationRuleService.create({
      workspaceId: workspace.id,
      input,
    });
  }

  @Mutation(() => ValidationRuleDTO)
  async updateValidationRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: UpdateValidationRuleInput,
  ): Promise<ValidationRuleDTO> {
    return this.validationRuleService.update({
      workspaceId: workspace.id,
      input,
    });
  }

  @Mutation(() => ValidationRuleDTO)
  async deleteValidationRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id', { type: () => UUIDScalarType }) id: string,
  ): Promise<ValidationRuleDTO> {
    return this.validationRuleService.delete({
      workspaceId: workspace.id,
      id,
    });
  }
}
