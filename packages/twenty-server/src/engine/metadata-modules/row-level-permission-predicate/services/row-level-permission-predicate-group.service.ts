import { Injectable } from '@nestjs/common';

import { IsNull } from 'typeorm';

import { type RowLevelPermissionPredicateGroupDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate-group.dto';
import { RowLevelPermissionPredicateGroupEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate-group.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { type WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';

@Injectable()
export class RowLevelPermissionPredicateGroupService {
  constructor(
    @InjectWorkspaceScopedRepository(RowLevelPermissionPredicateGroupEntity)
    private readonly predicateGroupRepository: WorkspaceScopedRepository<RowLevelPermissionPredicateGroupEntity>,
  ) {}

  async findByWorkspaceId(
    workspaceId: string,
  ): Promise<RowLevelPermissionPredicateGroupDTO[]> {
    const predicateGroups = await this.predicateGroupRepository.find(
      workspaceId,
      {
        where: { deletedAt: IsNull() },
      },
    );

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
