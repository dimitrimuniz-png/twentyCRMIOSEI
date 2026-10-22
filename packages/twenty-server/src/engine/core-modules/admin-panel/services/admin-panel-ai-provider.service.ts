import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { type Repository } from 'typeorm';

import {
  AdminPanelException,
  AdminPanelExceptionCode,
} from 'src/engine/core-modules/admin-panel/admin-panel.exception';
import { type CustomAiProviderAccessDTO } from 'src/engine/core-modules/admin-panel/dtos/admin-panel-ai-provider.dto';
import { MAX_SEATS_WITHOUT_ENTERPRISE_KEY } from 'src/engine/core-modules/enterprise/constants/max-seats-without-organization-key.constant';
import { CustomAiProviderAccessService } from 'src/engine/core-modules/enterprise/services/custom-ai-provider-access.service';
import {
  ForbiddenError,
  UserInputError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { ConfigSource } from 'src/engine/core-modules/twenty-config/enums/config-source.enum';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { DefaultAiCatalogService } from 'src/engine/metadata-modules/ai/ai-models/services/default-ai-catalog.service';
import { ModelsDevCatalogService } from 'src/engine/metadata-modules/ai/ai-models/services/models-dev-catalog.service';
import { type AiProviderConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-config.type';
import { aiProviderConfigSchema } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-config.schema';
import { type AiProviderModelConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-model-config.type';
import { aiProviderModelConfigSchema } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-model-config.schema';
import { type AiProvidersConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-providers-config.type';
import { extractConfigVariableName } from 'src/engine/metadata-modules/ai/ai-models/utils/extract-config-variable-name.util';

type ListedAiProvider = AiProviderConfig & {
  source: 'catalog' | 'custom';
  apiKeyConfigVariable?: string;
  hasAccessKey?: boolean;
};

@Injectable()
export class AdminPanelAiProviderService {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly defaultAiCatalogService: DefaultAiCatalogService,
    private readonly modelsDevCatalogService: ModelsDevCatalogService,
    private readonly customAiProviderAccessService: CustomAiProviderAccessService,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  listAiProviders(): Record<string, ListedAiProvider> {
    const listed: Record<string, ListedAiProvider> = {};

    for (const [providerName, config] of Object.entries(
      this.defaultAiCatalogService.getDefaultAiCatalog(),
    )) {
      listed[providerName] = this.listCatalogProvider(config);
    }

    for (const [providerName, config] of Object.entries(this.readProviders())) {
      listed[providerName] = { ...config, source: 'custom' };
    }

    return listed;
  }

  async getCustomAiProviderAccess(): Promise<CustomAiProviderAccessDTO> {
    return {
      hasAccess: this.customAiProviderAccessService.getCachedHasAccess(),
      seatCount: await this.userWorkspaceRepository.count(),
      seatThreshold: MAX_SEATS_WITHOUT_ENTERPRISE_KEY,
    };
  }

  getModelsDevProviders() {
    return this.modelsDevCatalogService.getProviderSuggestions();
  }

  getModelsDevSuggestions(providerType: string) {
    return this.modelsDevCatalogService.getModelSuggestions(providerType);
  }

  async addAiProvider(
    providerName: string,
    providerConfig: unknown,
  ): Promise<boolean> {
    const parsed = aiProviderConfigSchema.safeParse(providerConfig);

    if (!parsed.success) {
      throw new UserInputError(
        parsed.error.issues[0]?.message ?? 'Invalid provider',
      );
    }

    this.assertProviderNameIsNotBuiltIn(providerName);
    this.assertCustomProviderAccess();

    const providers = this.readProviders();

    providers[providerName] = parsed.data;
    await this.writeProviders(providers);

    return true;
  }

  async removeAiProvider(providerName: string): Promise<boolean> {
    const providers = this.readProviders();

    delete providers[providerName];
    await this.writeProviders(providers);

    return true;
  }

  async addModelToProvider(
    providerName: string,
    modelConfig: unknown,
  ): Promise<boolean> {
    const parsed = aiProviderModelConfigSchema.safeParse(modelConfig);

    if (!parsed.success) {
      throw new UserInputError(
        parsed.error.issues[0]?.message ?? 'Invalid model',
      );
    }

    this.assertProviderNameIsNotBuiltIn(providerName);
    this.assertCustomProviderAccess();

    const providers = this.readProviders();
    const provider = providers[providerName];

    if (!isDefined(provider)) {
      throw new UserInputError(`Provider ${providerName} was not found`);
    }

    const models = provider.models ?? [];
    const existingIndex = models.findIndex(
      (model) => model.name === parsed.data.name,
    );
    const nextModels =
      existingIndex === -1
        ? [...models, parsed.data]
        : models.map((model, index) =>
            index === existingIndex ? parsed.data : model,
          );

    providers[providerName] = { ...provider, models: nextModels };
    await this.writeProviders(providers);

    return true;
  }

  async removeModelFromProvider(
    providerName: string,
    modelName: string,
  ): Promise<boolean> {
    const providers = this.readProviders();
    const provider = providers[providerName];

    if (!isDefined(provider)) {
      return true;
    }

    providers[providerName] = {
      ...provider,
      models: (provider.models ?? []).filter(
        (model: AiProviderModelConfig) => model.name !== modelName,
      ),
    };
    await this.writeProviders(providers);

    return true;
  }

  private assertProviderNameIsNotBuiltIn(providerName: string): void {
    if (
      isDefined(
        this.defaultAiCatalogService.getDefaultAiCatalog()[providerName],
      )
    ) {
      throw new UserInputError(
        new AdminPanelException(
          `Provider ${providerName} is built in`,
          AdminPanelExceptionCode.BUILT_IN_AI_PROVIDER_NAME,
        ),
      );
    }
  }

  private assertCustomProviderAccess(): void {
    if (this.customAiProviderAccessService.getCachedHasAccess()) {
      return;
    }

    throw new ForbiddenError(
      'Custom AI providers are not available on this build',
    );
  }

  private readProviders(): AiProvidersConfig {
    return structuredClone(this.twentyConfigService.get('AI_PROVIDERS') ?? {});
  }

  private async writeProviders(providers: AiProvidersConfig): Promise<void> {
    const metadata =
      this.twentyConfigService.getVariableWithMetadata('AI_PROVIDERS');
    const isStoredInDatabase = metadata?.source === ConfigSource.DATABASE;

    if (Object.keys(providers).length === 0) {
      if (isStoredInDatabase) {
        await this.twentyConfigService.delete('AI_PROVIDERS');
      }

      return;
    }

    if (isStoredInDatabase) {
      await this.twentyConfigService.update('AI_PROVIDERS', providers);

      return;
    }

    await this.twentyConfigService.set('AI_PROVIDERS', providers);
  }

  private listCatalogProvider(config: AiProviderConfig): ListedAiProvider {
    const listed: ListedAiProvider = { ...config, source: 'catalog' };
    const apiKeyVariable = extractConfigVariableName(config.apiKey);

    if (isDefined(apiKeyVariable)) {
      delete listed.apiKey;
      listed.apiKeyConfigVariable = apiKeyVariable;
    }

    if (
      isDefined(extractConfigVariableName(config.accessKeyId)) ||
      isDefined(extractConfigVariableName(config.secretAccessKey))
    ) {
      delete listed.accessKeyId;
      delete listed.secretAccessKey;
      listed.hasAccessKey = true;
    }

    return listed;
  }
}
