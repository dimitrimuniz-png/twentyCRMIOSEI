import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, IsNull, type Repository } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
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
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { type WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';

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
  rowLevelPermissionPredicateGroupId:
    predicate.rowLevelPermissionPredicateGroupId,
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

const orderById = <TRow extends { id: string }>(
  rows: TRow[],
  ids: string[],
): TRow[] => {
  const rowById = new Map(rows.map((row) => [row.id, row]));

  return ids.map((id) => {
    const row = rowById.get(id);

    if (!isDefined(row)) {
      throw new Error(
        `Row-level permission predicate row ${id} was not persisted.`,
      );
    }

    return row;
  });
};

@Injectable()
export class RowLevelPermissionPredicateService {
  constructor(
    @InjectWorkspaceScopedRepository(RowLevelPermissionPredicateEntity)
    private readonly predicateRepository: WorkspaceScopedRepository<RowLevelPermissionPredicateEntity>,
    @InjectWorkspaceScopedRepository(RowLevelPermissionPredicateGroupEntity)
    private readonly predicateGroupRepository: WorkspaceScopedRepository<RowLevelPermissionPredicateGroupEntity>,
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
    const predicates = await this.predicateRepository.find(workspaceId, {
      where: { deletedAt: IsNull() },
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
      roleId: input.roleId,
      objectMetadataId: input.objectMetadataId,
      deletedAt: IsNull(),
    };
    const [existingGroups, existingPredicates] = await Promise.all([
      this.predicateGroupRepository.find(workspaceId, { where: scope }),
      this.predicateRepository.find(workspaceId, { where: scope }),
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
      await this.predicateRepository.softDelete(workspaceId, {
        id: In(predicatesToRemove.map((predicate) => predicate.id)),
      });
    }

    if (groupsToRemove.length > 0) {
      await this.predicateGroupRepository.softDelete(workspaceId, {
        id: In(groupsToRemove.map((group) => group.id)),
      });
    }

    const groupRows = input.predicateGroups.map((group) => ({
      id: group.id ?? v4(),
      universalIdentifier:
        existingGroups.find((existing) => existing.id === group.id)
          ?.universalIdentifier ?? v4(),
      applicationId:
        existingGroups.find((existing) => existing.id === group.id)
          ?.applicationId ?? workspace.workspaceCustomApplicationId,
      roleId: input.roleId,
      objectMetadataId: group.objectMetadataId,
      logicalOperator: group.logicalOperator,
      parentRowLevelPermissionPredicateGroupId:
        group.parentRowLevelPermissionPredicateGroupId ?? null,
      positionInRowLevelPermissionPredicateGroup:
        group.positionInRowLevelPermissionPredicateGroup ?? null,
    }));
    const predicateRows = input.predicates.map((predicate) => ({
      id: predicate.id ?? v4(),
      universalIdentifier:
        existingPredicates.find((existing) => existing.id === predicate.id)
          ?.universalIdentifier ?? v4(),
      applicationId:
        existingPredicates.find((existing) => existing.id === predicate.id)
          ?.applicationId ?? workspace.workspaceCustomApplicationId,
      roleId: input.roleId,
      objectMetadataId: input.objectMetadataId,
      fieldMetadataId: predicate.fieldMetadataId,
      operand: predicate.operand,
      value: (predicate.value ??
        null) as RowLevelPermissionPredicateEntity['value'],
      subFieldName: predicate.subFieldName ?? null,
      workspaceMemberFieldMetadataId:
        predicate.workspaceMemberFieldMetadataId ?? null,
      workspaceMemberSubFieldName:
        predicate.workspaceMemberSubFieldName ?? null,
      rowLevelPermissionPredicateGroupId:
        predicate.rowLevelPermissionPredicateGroupId ?? null,
      positionInRowLevelPermissionPredicateGroup:
        predicate.positionInRowLevelPermissionPredicateGroup ?? null,
    }));

    if (groupRows.length > 0) {
      await this.predicateGroupRepository.upsert(workspaceId, groupRows, [
        'id',
      ]);
    }

    if (predicateRows.length > 0) {
      // TypeORM's deep partial distributes over the jsonb value union.
      await this.predicateRepository.upsert(
        workspaceId,
        predicateRows as QueryDeepPartialEntity<RowLevelPermissionPredicateEntity>[],
        ['id'],
      );
    }

    const [persistedGroups, persistedPredicates] = await Promise.all([
      groupRows.length === 0
        ? []
        : this.predicateGroupRepository.find(workspaceId, {
            where: { id: In(groupRows.map((group) => group.id)) },
          }),
      predicateRows.length === 0
        ? []
        : this.predicateRepository.find(workspaceId, {
            where: { id: In(predicateRows.map((predicate) => predicate.id)) },
          }),
    ]);

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatRowLevelPermissionPredicateMaps',
      'flatRowLevelPermissionPredicateGroupMaps',
      'rolesPermissions',
    ]);

    return {
      predicateGroups: orderById(
        persistedGroups,
        groupRows.map((group) => group.id),
      ).map(toGroupDto),
      predicates: orderById(
        persistedPredicates,
        predicateRows.map((predicate) => predicate.id),
      ).map(toPredicateDto),
    };
  }
}
