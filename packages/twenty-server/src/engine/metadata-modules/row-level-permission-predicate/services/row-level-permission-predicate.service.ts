import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type RowLevelPermissionPredicateGroupDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate-group.dto';
import { type RowLevelPermissionPredicateDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate.dto';
import { type UpsertRowLevelPermissionPredicatesInput } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/inputs/upsert-row-level-permission-predicates.input';
import { type UpsertRowLevelPermissionPredicatesResultDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/upsert-row-level-permission-predicates-result.dto';
import { RowLevelPermissionPredicateGroupEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate-group.entity';
import { RowLevelPermissionPredicateEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate.entity';

const toPredicateDto = (
  predicate: RowLevelPermissionPredicateEntity,
): RowLevelPermissionPredicateDTO => ({
  id: predicate.id,
  fieldMetadataId: predicate.fieldMetadataId,
  objectMetadataId: predicate.objectMetadataId,
  operand: predicate.operand,
  positionInRowLevelPermissionPredicateGroup:
    predicate.positionInRowLevelPermissionPredicateGroup,
  roleId: predicate.roleId,
  rowLevelPermissionPredicateGroupId: predicate.rowLevelPermissionPredicateGroupId,
  subFieldName: predicate.subFieldName,
  value: predicate.value,
  workspaceMemberFieldMetadataId: predicate.workspaceMemberFieldMetadataId,
  workspaceMemberSubFieldName: predicate.workspaceMemberSubFieldName,
});

const toGroupDto = (
  predicateGroup: RowLevelPermissionPredicateGroupEntity,
): RowLevelPermissionPredicateGroupDTO => ({
  id: predicateGroup.id,
  logicalOperator: predicateGroup.logicalOperator,
  objectMetadataId: predicateGroup.objectMetadataId,
  parentRowLevelPermissionPredicateGroupId:
    predicateGroup.parentRowLevelPermissionPredicateGroupId,
  positionInRowLevelPermissionPredicateGroup:
    predicateGroup.positionInRowLevelPermissionPredicateGroup,
  roleId: predicateGroup.roleId,
});

@Injectable()
export class RowLevelPermissionPredicateService {
  constructor(
    @InjectRepository(RowLevelPermissionPredicateEntity)
    private readonly predicateRepository: Repository<RowLevelPermissionPredicateEntity>,
    @InjectRepository(RowLevelPermissionPredicateGroupEntity)
    private readonly predicateGroupRepository: Repository<RowLevelPermissionPredicateGroupEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  // Row-level rules in this fork are not a commercial entitlement.
  async hasRowLevelPermissionFeature(_workspaceId: string): Promise<boolean> {
    return true;
  }

  async findByWorkspaceId(
    workspaceId: string,
  ): Promise<RowLevelPermissionPredicateDTO[]> {
    const predicates = await this.predicateRepository.find({
      where: { workspaceId, deletedAt: IsNull() },
    });

    return predicates.map(toPredicateDto);
  }

  async upsertRowLevelPermissionPredicates({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: UpsertRowLevelPermissionPredicatesInput;
  }): Promise<UpsertRowLevelPermissionPredicatesResultDTO> {
    const workspace = await this.workspaceRepository.findOneByOrFail({
      id: workspaceId,
    });
    const scope = {
      workspaceId,
      roleId: input.roleId,
      objectMetadataId: input.objectMetadataId,
      deletedAt: IsNull(),
    };
    const [existingGroups, existingPredicates] = await Promise.all([
      this.predicateGroupRepository.find({ where: scope }),
      this.predicateRepository.find({ where: scope }),
    ]);
    const incomingGroupIds = new Set(
      input.predicateGroups.map((group) => group.id).filter(isDefined),
    );
    const incomingPredicateIds = new Set(
      input.predicates.map((predicate) => predicate.id).filter(isDefined),
    );

    const groupsToRemove = existingGroups.filter(
      (group) => !incomingGroupIds.has(group.id),
    );
    const predicatesToRemove = existingPredicates.filter(
      (predicate) => !incomingPredicateIds.has(predicate.id),
    );

    if (predicatesToRemove.length > 0) {
      await this.predicateRepository.softRemove(predicatesToRemove);
    }

    if (groupsToRemove.length > 0) {
      await this.predicateGroupRepository.softRemove(groupsToRemove);
    }

    const savedGroups = await this.predicateGroupRepository.save(
      input.predicateGroups.map((group) =>
        this.predicateGroupRepository.create({
          id: group.id ?? v4(),
          universalIdentifier:
            existingGroups.find((existing) => existing.id === group.id)
              ?.universalIdentifier ?? v4(),
          applicationId:
            existingGroups.find((existing) => existing.id === group.id)
              ?.applicationId ?? workspace.workspaceCustomApplicationId,
          workspaceId,
          roleId: input.roleId,
          objectMetadataId: group.objectMetadataId,
          logicalOperator: group.logicalOperator,
          parentRowLevelPermissionPredicateGroupId:
            group.parentRowLevelPermissionPredicateGroupId ?? null,
          positionInRowLevelPermissionPredicateGroup:
            group.positionInRowLevelPermissionPredicateGroup ?? null,
        }),
      ),
    );
    const savedPredicates = await this.predicateRepository.save(
      input.predicates.map((predicate) =>
        this.predicateRepository.create({
          id: predicate.id ?? v4(),
          universalIdentifier:
            existingPredicates.find((existing) => existing.id === predicate.id)
              ?.universalIdentifier ?? v4(),
          applicationId:
            existingPredicates.find((existing) => existing.id === predicate.id)
              ?.applicationId ?? workspace.workspaceCustomApplicationId,
          workspaceId,
          roleId: input.roleId,
          objectMetadataId: input.objectMetadataId,
          fieldMetadataId: predicate.fieldMetadataId,
          operand: predicate.operand,
          value: (predicate.value ?? null) as RowLevelPermissionPredicateEntity['value'],
          subFieldName: predicate.subFieldName ?? null,
          workspaceMemberFieldMetadataId:
            predicate.workspaceMemberFieldMetadataId ?? null,
          workspaceMemberSubFieldName:
            predicate.workspaceMemberSubFieldName ?? null,
          rowLevelPermissionPredicateGroupId:
            predicate.rowLevelPermissionPredicateGroupId ?? null,
          positionInRowLevelPermissionPredicateGroup:
            predicate.positionInRowLevelPermissionPredicateGroup ?? null,
        }),
      ),
    );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatRowLevelPermissionPredicateMaps',
      'flatRowLevelPermissionPredicateGroupMaps',
      'rolesPermissions',
    ]);

    return {
      predicateGroups: savedGroups.map(toGroupDto),
      predicates: savedPredicates.map(toPredicateDto),
    };
  }
}
