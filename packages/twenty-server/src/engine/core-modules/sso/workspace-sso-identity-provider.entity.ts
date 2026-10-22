import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

export enum IdentityProviderType {
  OIDC = 'OIDC',
  SAML = 'SAML',
}

export enum SsoIdentityProviderStatus {
  Active = 'Active',
  Error = 'Error',
  Inactive = 'Inactive',
}

registerEnumType(IdentityProviderType, { name: 'IdentityProviderType' });
registerEnumType(SsoIdentityProviderStatus, {
  name: 'SsoIdentityProviderStatus',
});

@Entity({ name: 'ssoIdentityProvider', schema: 'core' })
@ObjectType('SSOIdentityProvider')
@Index('IDX_SSO_IDENTITY_PROVIDER_WORKSPACE_ID', ['workspaceId'])
export class WorkspaceSsoIdentityProviderEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_sso_identity_provider',
  })
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => IdentityProviderType)
  @Column({ type: 'varchar' })
  type: IdentityProviderType;

  @Field(() => SsoIdentityProviderStatus)
  @Column({
    type: 'varchar',
    default: SsoIdentityProviderStatus.Active,
  })
  status: SsoIdentityProviderStatus;

  @Field()
  @Column()
  issuer: string;

  @Column({ nullable: true, type: 'text' })
  certificate: string | null;

  @Column({ nullable: true, type: 'varchar' })
  ssoUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  clientId: string | null;

  @Column({ nullable: true, type: 'text' })
  clientSecret: string | null;

  @Field()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ManyToOne(
    () => WorkspaceEntity,
    (workspace) => workspace.workspaceSsoIdentityProviders,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'workspaceId',
    foreignKeyConstraintName: 'FK_sso_identity_provider_workspace',
  })
  workspace: Relation<WorkspaceEntity>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
