import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Entity({ name: 'workspaceAuditLog', schema: 'core' })
@Index('IDX_WORKSPACE_AUDIT_LOG_WORKSPACE_TABLE_OCCURRED_AT', [
  'workspaceId',
  'tableName',
  'occurredAt',
])
export class WorkspaceAuditLogEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_workspace_audit_log',
  })
  id: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'workspaceId',
    foreignKeyConstraintName: 'FK_workspace_audit_log_workspace',
  })
  workspace: Relation<WorkspaceEntity>;

  @Column({ type: 'varchar' })
  tableName: string;

  @Column({ type: 'varchar' })
  event: string;

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', nullable: true })
  recordId: string | null;

  @Column({ type: 'uuid', nullable: true })
  objectMetadataId: string | null;

  @Column({ type: 'jsonb', default: {} })
  properties: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
