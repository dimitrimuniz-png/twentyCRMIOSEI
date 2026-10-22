import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { AdminResolver } from 'src/engine/api/graphql/graphql-config/decorators/admin-resolver.decorator';
import {
  CustomAiProviderAccessDTO,
  ModelsDevModelSuggestionDTO,
  ModelsDevProviderSuggestionDTO,
} from 'src/engine/core-modules/admin-panel/dtos/admin-panel-ai-provider.dto';
import { AdminPanelAiProviderService } from 'src/engine/core-modules/admin-panel/services/admin-panel-ai-provider.service';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { ConfigVariableGraphqlApiExceptionFilter } from 'src/engine/core-modules/twenty-config/filters/config-variable-graphql-api-exception.filter';
import { AdminPanelGuard } from 'src/engine/guards/admin-panel-guard';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

@UsePipes(ResolverValidationPipe)
@AdminResolver()
@UseFilters(
  AuthGraphqlApiExceptionFilter,
  ConfigVariableGraphqlApiExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
)
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
  AdminPanelGuard,
)
export class AdminPanelAiProviderResolver {
  constructor(
    private readonly adminPanelAiProviderService: AdminPanelAiProviderService,
  ) {}

  @Query(() => GraphQLJSON)
  getAiProviders(): Record<string, unknown> {
    return this.adminPanelAiProviderService.listAiProviders();
  }

  @Query(() => CustomAiProviderAccessDTO)
  getCustomAiProviderAccess(): Promise<CustomAiProviderAccessDTO> {
    return this.adminPanelAiProviderService.getCustomAiProviderAccess();
  }

  @Query(() => [ModelsDevProviderSuggestionDTO])
  getModelsDevProviders(): Promise<ModelsDevProviderSuggestionDTO[]> {
    return this.adminPanelAiProviderService.getModelsDevProviders();
  }

  @Query(() => [ModelsDevModelSuggestionDTO])
  getModelsDevSuggestions(
    @Args('providerType', { type: () => String }) providerType: string,
  ): Promise<ModelsDevModelSuggestionDTO[]> {
    return this.adminPanelAiProviderService.getModelsDevSuggestions(
      providerType,
    );
  }

  @Mutation(() => Boolean)
  addAiProvider(
    @Args('providerName', { type: () => String }) providerName: string,
    @Args('providerConfig', { type: () => GraphQLJSON })
    providerConfig: unknown,
  ): Promise<boolean> {
    return this.adminPanelAiProviderService.addAiProvider(
      providerName,
      providerConfig,
    );
  }

  @Mutation(() => Boolean)
  removeAiProvider(
    @Args('providerName', { type: () => String }) providerName: string,
  ): Promise<boolean> {
    return this.adminPanelAiProviderService.removeAiProvider(providerName);
  }

  @Mutation(() => Boolean)
  addModelToProvider(
    @Args('providerName', { type: () => String }) providerName: string,
    @Args('modelConfig', { type: () => GraphQLJSON }) modelConfig: unknown,
  ): Promise<boolean> {
    return this.adminPanelAiProviderService.addModelToProvider(
      providerName,
      modelConfig,
    );
  }

  @Mutation(() => Boolean)
  removeModelFromProvider(
    @Args('providerName', { type: () => String }) providerName: string,
    @Args('modelName', { type: () => String }) modelName: string,
  ): Promise<boolean> {
    return this.adminPanelAiProviderService.removeModelFromProvider(
      providerName,
      modelName,
    );
  }
}
