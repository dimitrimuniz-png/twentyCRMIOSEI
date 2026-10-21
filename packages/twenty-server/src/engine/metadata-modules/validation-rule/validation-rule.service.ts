import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
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
    @InjectRepository(ValidationRuleEntity)
    private readonly validationRuleRepository: Repository<ValidationRuleEntity>,
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
    const rules = await this.validationRuleRepository.find({
      where: { workspaceId, objectMetadataId },
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
    const saved = await this.validationRuleRepository.save(
      this.validationRuleRepository.create({
        id: v4(),
        universalIdentifier: v4(),
        applicationId: workspace.workspaceCustomApplicationId,
        workspaceId,
        objectMetadataId: input.objectMetadataId,
        errorFieldMetadataId: input.errorFieldMetadataId ?? null,
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? null,
        expression: input.expression,
        bindings: {},
        message: input.message,
        isActive: input.isActive ?? true,
      }),
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
    const rule = await this.validationRuleRepository.findOneByOrFail({
      id: input.id,
      workspaceId,
    });
    const { update } = input;

    if (isDefined(update.name)) {
      rule.name = update.name;
    }

    if (isDefined(update.description)) {
      rule.description = update.description;
    }

    if (isDefined(update.icon)) {
      rule.icon = update.icon;
    }

    if (isDefined(update.expression)) {
      rule.expression = update.expression;
    }

    if (isDefined(update.message)) {
      rule.message = update.message;
    }

    if (isDefined(update.isActive)) {
      rule.isActive = update.isActive;
    }

    if (isDefined(update.errorFieldMetadataId)) {
      rule.errorFieldMetadataId = update.errorFieldMetadataId;
    }

    const saved = await this.validationRuleRepository.save(rule);

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
    const rule = await this.validationRuleRepository.findOneByOrFail({
      id,
      workspaceId,
    });
    const dto = toDto(rule);

    await this.validationRuleRepository.delete({ id, workspaceId });
    await this.refreshCache(workspaceId);

    return dto;
  }

  private async refreshCache(workspaceId: string): Promise<void> {
    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatValidationRuleMaps',
    ]);
  }
}
