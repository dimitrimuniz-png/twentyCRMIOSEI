import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { RowLevelPermissionPredicateOperand } from 'twenty-shared/types';

import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { RowLevelPermissionPredicateGroupEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate-group.entity';
import { SyncableEntity } from 'src/engine/workspace-manager/types/syncable-entity.interface';

@Entity({ name: 'rowLevelPermissionPredicate', schema: 'core' })
@Index('IDX_RLPP_WORKSPACE_ID_ROLE_ID', ['workspaceId', 'roleId'])
@Index('IDX_RLPP_GROUP_ID', ['rowLevelPermissionPredicateGroupId'])
export class RowLevelPermissionPredicateEntity
  extends SyncableEntity
  implements Required<RowLevelPermissionPredicateEntity>
{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  fieldMetadataId: string;

  @Column({ nullable: false, type: 'uuid' })
  objectMetadataId: string;

  @Column({
    type: 'enum',
    enum: RowLevelPermissionPredicateOperand,
    enumName: 'rowLevelPermissionPredicate_operand_enum',
    default: RowLevelPermissionPredicateOperand.CONTAINS,
  })
  operand: RowLevelPermissionPredicateOperand;

  @Column({ nullable: true, type: 'jsonb' })
  value: Record<string, unknown> | string | number | boolean | null;

  @Column({ nullable: true, type: 'text' })
  subFieldName: string | null;

  @Column({ nullable: true, type: 'uuid' })
  workspaceMemberFieldMetadataId: string | null;

  @Column({ nullable: true, type: 'text' })
  workspaceMemberSubFieldName: string | null;

  @Column({ nullable: true, type: 'uuid' })
  rowLevelPermissionPredicateGroupId: string | null;

  @Column({ nullable: true, type: 'double precision' })
  positionInRowLevelPermissionPredicateGroup: number | null;

  @Column({ nullable: false, type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleEntity, (role) => role.rowLevelPermissionPredicates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: Relation<RoleEntity>;

  @ManyToOne(
    () => RowLevelPermissionPredicateGroupEntity,
    (group) => group.rowLevelPermissionPredicates,
    { onDelete: 'CASCADE', nullable: true },
  )
  @JoinColumn({ name: 'rowLevelPermissionPredicateGroupId' })
  rowLevelPermissionPredicateGroup: Relation<RowLevelPermissionPredicateGroupEntity> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
