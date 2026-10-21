import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { type RowLevelPermissionPredicateGroupDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate-group.dto';
import { RowLevelPermissionPredicateGroupEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate-group.entity';

@Injectable()
export class RowLevelPermissionPredicateGroupService {
  constructor(
    @InjectRepository(RowLevelPermissionPredicateGroupEntity)
    private readonly predicateGroupRepository: Repository<RowLevelPermissionPredicateGroupEntity>,
  ) {}

  async findByWorkspaceId(
    workspaceId: string,
  ): Promise<RowLevelPermissionPredicateGroupDTO[]> {
    const predicateGroups = await this.predicateGroupRepository.find({
      where: { workspaceId, deletedAt: IsNull() },
    });

    return predicateGroups.map((predicateGroup) => ({
      id: predicateGroup.id,
      logicalOperator: predicateGroup.logicalOperator,
      objectMetadataId: predicateGroup.objectMetadataId,
      parentRowLevelPermissionPredicateGroupId:
        predicateGroup.parentRowLevelPermissionPredicateGroupId,
      positionInRowLevelPermissionPredicateGroup:
        predicateGroup.positionInRowLevelPermissionPredicateGroup,
      roleId: predicateGroup.roleId,
    }));
  }
}
