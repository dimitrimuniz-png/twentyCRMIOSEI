import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'workspaceAuditLog', schema: 'core' })
@Index('IDX_WORKSPACE_AUDIT_LOG_WORKSPACE_TABLE_OCCURRED_AT', [
  'workspaceId',
  'tableName',
  'occurredAt',
])
export class WorkspaceAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

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
