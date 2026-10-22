import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { In, IsNull, type Repository } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  FieldMetadataType,
  RowLevelPermissionPredicateOperand,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  FlatEntityMapsException,
  FlatEntityMapsExceptionCode,
} from 'src/engine/metadata-modules/flat-entity/exceptions/flat-entity-maps.exception';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { type RowLevelPermissionPredicateGroupDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate-group.dto';
import {
  type RowLevelPermissionPredicateDTO,
  type RowLevelPermissionPredicateInput,
} from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate.dto';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { type UpsertRowLevelPermissionPredicatesInput } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/inputs/upsert-row-level-permission-predicates.input';
import {
  RowLevelPermissionPredicateException,
  RowLevelPermissionPredicateExceptionCode,
} from 'src/engine/metadata-modules/row-level-permission-predicate/exceptions/row-level-permission-predicate.exception';
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

const RELATION_COMPARISON_OPERANDS =
  new Set<RowLevelPermissionPredicateOperand>([
    RowLevelPermissionPredicateOperand.IS,
    RowLevelPermissionPredicateOperand.IS_NOT,
    RowLevelPermissionPredicateOperand.IS_EMPTY,
    RowLevelPermissionPredicateOperand.IS_NOT_EMPTY,
    RowLevelPermissionPredicateOperand.IS_NOT_NULL,
  ]);

const isRelationField = (field: Pick<FieldMetadataEntity, 'type'>): boolean =>
  field.type === FieldMetadataType.RELATION ||
  field.type === FieldMetadataType.MORPH_RELATION;

// An IS comparison on a relation compiles only when it names records or the
// current workspace member. An empty selection, including "current record",
// matches nothing and must be refused before it is stored.
const relationSelectionCompiles = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const selection = value as {
    selectedRecordIds?: unknown;
    isCurrentWorkspaceMemberSelected?: unknown;
  };

  if (!Array.isArray(selection.selectedRecordIds)) {
    return false;
  }

  const hasSelectedRecord = selection.selectedRecordIds.some(
    (recordId) => typeof recordId === 'string' && recordId.length > 0,
  );

  return (
    hasSelectedRecord || selection.isCurrentWorkspaceMemberSelected === true
  );
};

// A child group row fails its parent FK when it is inserted before the parent.
const orderGroupsParentsFirst = <
  TGroup extends {
    id: string;
    parentRowLevelPermissionPredicateGroupId: string | null;
  },
>(
  groups: TGroup[],
): TGroup[] => {
  const pending = [...groups];
  const ordered: TGroup[] = [];
  const placedIds = new Set<string>();

  while (pending.length > 0) {
    const readyIndex = pending.findIndex((group) => {
      const parentId = group.parentRowLevelPermissionPredicateGroupId;

      return (
        !isDefined(parentId) ||
        placedIds.has(parentId) ||
        pending.every((candidate) => candidate.id !== parentId)
      );
    });
    const [group] = pending.splice(readyIndex === -1 ? 0 : readyIndex, 1);

    ordered.push(group);
    placedIds.add(group.id);
  }

  return ordered;
};

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
    // Field metadata lives in core, next to the workspace row, not in the workspace schema.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(FieldMetadataEntity)
    private readonly fieldMetadataRepository: Repository<FieldMetadataEntity>,
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
    await this.assertPredicatesCanBeEnforced({
      workspaceId,
      predicates: input.predicates,
    });
    await this.assertReferencedGroups({
      workspaceId,
      input,
    });

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

    const groupRows = input.predicateGroups.map((group) => {
      const id = group.id ?? v4();

      return {
        id,
        // A new group is addressed by the id the caller sent, including on export.
        universalIdentifier:
          existingGroups.find((existing) => existing.id === id)
            ?.universalIdentifier ?? id,
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
        deletedAt: null,
      };
    });
    const predicateRows = input.predicates.map((predicate) => {
      const id = predicate.id ?? v4();

      return {
        id,
        universalIdentifier:
          existingPredicates.find((existing) => existing.id === id)
            ?.universalIdentifier ?? id,
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
        deletedAt: null,
      };
    });

    // The predicate foreign key is checked when its statement runs, so the
    // group row has to be committed first.
    const persistedGroups = await this.predicateGroupRepository.upsertReturning(
      workspaceId,
      orderGroupsParentsFirst(groupRows),
      ['id'],
    );
    const persistedPredicates = await this.predicateRepository.upsertReturning(
      workspaceId,
      predicateRows as QueryDeepPartialEntity<RowLevelPermissionPredicateEntity>[],
      ['id'],
    );

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

  private async assertPredicatesCanBeEnforced({
    workspaceId,
    predicates,
  }: {
    workspaceId: string;
    predicates: RowLevelPermissionPredicateInput[];
  }): Promise<void> {
    const fieldMetadataIds = [
      ...new Set(
        predicates.flatMap((predicate) =>
          [
            predicate.fieldMetadataId,
            predicate.workspaceMemberFieldMetadataId,
          ].filter(isDefined),
        ),
      ),
    ];

    if (fieldMetadataIds.length === 0) {
      return;
    }

    const fields = await this.fieldMetadataRepository.find({
      where: { id: In(fieldMetadataIds), workspaceId },
    });
    const fieldById = new Map(fields.map((field) => [field.id, field]));

    for (const predicate of predicates) {
      const field = fieldById.get(predicate.fieldMetadataId);
      const workspaceMemberField = isDefined(
        predicate.workspaceMemberFieldMetadataId,
      )
        ? fieldById.get(predicate.workspaceMemberFieldMetadataId)
        : undefined;

      if (!isDefined(field)) {
        throw new PermissionsException(
          PermissionsExceptionMessage.FIELD_METADATA_NOT_FOUND,
          PermissionsExceptionCode.FIELD_METADATA_NOT_FOUND,
        );
      }

      if (
        isDefined(predicate.workspaceMemberFieldMetadataId) &&
        !isDefined(workspaceMemberField)
      ) {
        throw new PermissionsException(
          PermissionsExceptionMessage.FIELD_METADATA_NOT_FOUND,
          PermissionsExceptionCode.FIELD_METADATA_NOT_FOUND,
        );
      }

      if (
        isRelationField(field) &&
        !RELATION_COMPARISON_OPERANDS.has(predicate.operand)
      ) {
        throw new RowLevelPermissionPredicateException(
          `Operand ${predicate.operand} cannot be applied to relation field ${field.name}`,
          RowLevelPermissionPredicateExceptionCode.INVALID_ROW_LEVEL_PERMISSION_PREDICATE_DATA,
        );
      }

      // Comparing two relations (the record's field and the current member's
      // field) has no static record selection; the member field supplies it.
      if (
        isRelationField(field) &&
        predicate.operand === RowLevelPermissionPredicateOperand.IS &&
        !isDefined(predicate.workspaceMemberFieldMetadataId) &&
        !relationSelectionCompiles(predicate.value)
      ) {
        throw new RowLevelPermissionPredicateException(
          `Predicate on relation field ${field.name} does not select any record`,
          RowLevelPermissionPredicateExceptionCode.INVALID_ROW_LEVEL_PERMISSION_PREDICATE_DATA,
        );
      }

      if (
        isDefined(workspaceMemberField) &&
        isRelationField(field) &&
        isRelationField(workspaceMemberField) &&
        field.relationTargetObjectMetadataId !==
          workspaceMemberField.relationTargetObjectMetadataId
      ) {
        throw new RowLevelPermissionPredicateException(
          'Row-level permission predicate relations must point to the same object',
          RowLevelPermissionPredicateExceptionCode.INVALID_ROW_LEVEL_PERMISSION_PREDICATE_DATA,
        );
      }
    }
  }

  private async assertReferencedGroups({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: UpsertRowLevelPermissionPredicatesInput;
  }): Promise<void> {
    const incomingGroupIds = new Set(
      input.predicateGroups.map((group) => group.id).filter(isDefined),
    );

    if (input.predicateGroups.length > 0) {
      const { flatObjectMetadataMaps } =
        await this.workspaceCacheService.getOrRecompute(workspaceId, [
          'flatObjectMetadataMaps',
        ]);
      const parentGroupIds = input.predicateGroups
        .map((group) => group.parentRowLevelPermissionPredicateGroupId)
        .filter(isDefined);
      const existingGroups =
        parentGroupIds.length === 0
          ? []
          : await this.predicateGroupRepository.find(workspaceId, {
              where: { id: In(parentGroupIds) },
            });
      const existingGroupIds = new Set(existingGroups.map((group) => group.id));

      for (const group of input.predicateGroups) {
        if (
          !isDefined(
            flatObjectMetadataMaps.universalIdentifierById[
              group.objectMetadataId
            ],
          )
        ) {
          throw new FlatEntityMapsException(
            'Could not find objectMetadata for given objectMetadataId',
            FlatEntityMapsExceptionCode.RELATION_UNIVERSAL_IDENTIFIER_NOT_FOUND,
          );
        }

        const parentGroupId = group.parentRowLevelPermissionPredicateGroupId;

        if (
          isDefined(parentGroupId) &&
          !incomingGroupIds.has(parentGroupId) &&
          !existingGroupIds.has(parentGroupId)
        ) {
          throw new FlatEntityMapsException(
            'Could not find rowLevelPermissionPredicateGroup for given parentRowLevelPermissionPredicateGroupId',
            FlatEntityMapsExceptionCode.RELATION_UNIVERSAL_IDENTIFIER_NOT_FOUND,
          );
        }
      }
    }

    const referencedGroupIds = input.predicates
      .map((predicate) => predicate.rowLevelPermissionPredicateGroupId)
      .filter(isDefined)
      .filter((groupId) => !incomingGroupIds.has(groupId));

    if (referencedGroupIds.length === 0) {
      return;
    }

    const groupsOfThisRoleAndObject = await this.predicateGroupRepository.find(
      workspaceId,
      {
        where: {
          id: In(referencedGroupIds),
          roleId: input.roleId,
          objectMetadataId: input.objectMetadataId,
          deletedAt: IsNull(),
        },
      },
    );
    const validGroupIds = new Set(
      groupsOfThisRoleAndObject.map((group) => group.id),
    );

    for (const groupId of referencedGroupIds) {
      if (validGroupIds.has(groupId)) {
        continue;
      }

      throw new RowLevelPermissionPredicateException(
        'Referenced predicate group is not a group of this role and object. Reference a group declared in predicateGroups or an existing group of this role and object.',
        RowLevelPermissionPredicateExceptionCode.INVALID_ROW_LEVEL_PERMISSION_PREDICATE_DATA,
        {
          userFriendlyMessage: msg`Invalid row level permission predicate data.`,
        },
      );
    }
  }
}
