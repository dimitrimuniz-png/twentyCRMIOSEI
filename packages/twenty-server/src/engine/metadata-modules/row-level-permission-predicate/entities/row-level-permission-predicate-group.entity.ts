import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { RowLevelPermissionPredicateGroupLogicalOperator } from 'twenty-shared/types';

import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { RowLevelPermissionPredicateEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate.entity';
import { SyncableEntity } from 'src/engine/workspace-manager/types/syncable-entity.interface';

@Entity({ name: 'rowLevelPermissionPredicateGroup', schema: 'core' })
@Index('IDX_RLPPG_WORKSPACE_ID_ROLE_ID_OBJECT_METADATA_ID', [
  'workspaceId',
  'roleId',
  'objectMetadataId',
])
@Index('IDX_RLPPG_PARENT_GROUP_ID', ['parentRowLevelPermissionPredicateGroupId'])
export class RowLevelPermissionPredicateGroupEntity
  extends SyncableEntity
  implements Required<RowLevelPermissionPredicateGroupEntity>
{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  objectMetadataId: string;

  @Column({
    type: 'enum',
    enum: RowLevelPermissionPredicateGroupLogicalOperator,
    enumName: 'rowLevelPermissionPredicateGroup_logicaloperator_enum',
    default: RowLevelPermissionPredicateGroupLogicalOperator.AND,
  })
  logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator;

  @Column({ nullable: true, type: 'uuid' })
  parentRowLevelPermissionPredicateGroupId: string | null;

  @ManyToOne(
    () => RowLevelPermissionPredicateGroupEntity,
    (group) => group.childRowLevelPermissionPredicateGroups,
    { onDelete: 'CASCADE', nullable: true },
  )
  @JoinColumn({ name: 'parentRowLevelPermissionPredicateGroupId' })
  parentRowLevelPermissionPredicateGroup: Relation<RowLevelPermissionPredicateGroupEntity> | null;

  @OneToMany(
    () => RowLevelPermissionPredicateGroupEntity,
    (group) => group.parentRowLevelPermissionPredicateGroup,
  )
  childRowLevelPermissionPredicateGroups: Relation<
    RowLevelPermissionPredicateGroupEntity[]
  >;

  @OneToMany(
    () => RowLevelPermissionPredicateEntity,
    (predicate) => predicate.rowLevelPermissionPredicateGroup,
  )
  rowLevelPermissionPredicates: Relation<RowLevelPermissionPredicateEntity[]>;

  @Column({ nullable: true, type: 'double precision' })
  positionInRowLevelPermissionPredicateGroup: number | null;

  @Column({ nullable: false, type: 'uuid' })
  roleId: string;

  @ManyToOne(
    () => RoleEntity,
    (role) => role.rowLevelPermissionPredicateGroups,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'roleId' })
  role: Relation<RoleEntity>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
