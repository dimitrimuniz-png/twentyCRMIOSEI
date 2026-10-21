import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { type Repository } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  type CreateValidationRuleInput,
  type UpdateValidationRuleInput,
  type ValidationRuleDTO,
} from 'src/engine/metadata-modules/validation-rule/dtos/validation-rule.dto';
import { ValidationRuleEntity } from 'src/engine/metadata-modules/validation-rule/entities/validation-rule.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { type WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';

const toDto = (rule: ValidationRuleEntity): ValidationRuleDTO => ({
  id: rule.id,
  description: rule.description,
  errorFieldMetadataId: rule.errorFieldMetadataId,
  expression: rule.expression,
  icon: rule.icon,
  isActive: rule.isActive,
  message: rule.message,
  name: rule.name,
  objectMetadataId: rule.objectMetadataId,
});

@Injectable()
export class ValidationRuleService {
  constructor(
    @InjectWorkspaceScopedRepository(ValidationRuleEntity)
    private readonly validationRuleRepository: WorkspaceScopedRepository<ValidationRuleEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async findByObject({
    workspaceId,
    objectMetadataId,
  }: {
    workspaceId: string;
    objectMetadataId: string;
  }): Promise<ValidationRuleDTO[]> {
    const rules = await this.validationRuleRepository.find(workspaceId, {
      where: { objectMetadataId },
      order: { createdAt: 'ASC' },
    });

    return rules.map(toDto);
  }

  async create({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: CreateValidationRuleInput;
  }): Promise<ValidationRuleDTO> {
    const workspace = await this.workspaceRepository.findOneByOrFail({
      id: workspaceId,
    });
    const id = v4();

    await this.validationRuleRepository.insert(workspaceId, {
      id,
      universalIdentifier: v4(),
      applicationId: workspace.workspaceCustomApplicationId,
      objectMetadataId: input.objectMetadataId,
      errorFieldMetadataId: input.errorFieldMetadataId ?? null,
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      expression: input.expression,
      bindings: {},
      message: input.message,
      isActive: input.isActive ?? true,
    });

    const saved = await this.validationRuleRepository.findOneOrFail(
      workspaceId,
      { where: { id } },
    );

    await this.refreshCache(workspaceId);

    return toDto(saved);
  }

  async update({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: UpdateValidationRuleInput;
  }): Promise<ValidationRuleDTO> {
    const rule = await this.validationRuleRepository.findOneOrFail(
      workspaceId,
      { where: { id: input.id } },
    );
    const { update } = input;
    const partial: QueryDeepPartialEntity<ValidationRuleEntity> = {};

    if (isDefined(update.name)) {
      partial.name = update.name;
    }

    if (isDefined(update.description)) {
      partial.description = update.description;
    }

    if (isDefined(update.icon)) {
      partial.icon = update.icon;
    }

    if (isDefined(update.expression)) {
      partial.expression = update.expression;
    }

    if (isDefined(update.message)) {
      partial.message = update.message;
    }

    if (isDefined(update.isActive)) {
      partial.isActive = update.isActive;
    }

    if (isDefined(update.errorFieldMetadataId)) {
      partial.errorFieldMetadataId = update.errorFieldMetadataId;
    }

    if (Object.keys(partial).length > 0) {
      await this.validationRuleRepository.update(
        workspaceId,
        { id: rule.id },
        partial,
      );
    }

    const saved = await this.validationRuleRepository.findOneOrFail(
      workspaceId,
      { where: { id: rule.id } },
    );

    await this.refreshCache(workspaceId);

    return toDto(saved);
  }

  async delete({
    workspaceId,
    id,
  }: {
    workspaceId: string;
    id: string;
  }): Promise<ValidationRuleDTO> {
    const rule = await this.validationRuleRepository.findOneOrFail(
      workspaceId,
      { where: { id } },
    );
    const dto = toDto(rule);

    await this.validationRuleRepository.delete(workspaceId, { id });
    await this.refreshCache(workspaceId);

    return dto;
  }

  private async refreshCache(workspaceId: string): Promise<void> {
    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatValidationRuleMaps',
    ]);
  }
}
