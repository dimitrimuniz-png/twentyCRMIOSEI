import { Field, ID, ObjectType } from '@nestjs/graphql';

import {
  IdentityProviderType,
  SsoIdentityProviderStatus,
} from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';
import { WorkspaceUrlsDTO } from 'src/engine/core-modules/workspace/dtos/workspace-urls.dto';

@ObjectType('AvailableWorkspaceSso')
export class AvailableWorkspaceSso {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  issuer: string;

  @Field(() => IdentityProviderType)
  type: IdentityProviderType;

  @Field(() => SsoIdentityProviderStatus)
  status: SsoIdentityProviderStatus;
}

@ObjectType('AvailableWorkspace')
export class AvailableWorkspace {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  displayName?: string;

  @Field(() => WorkspaceUrlsDTO)
  workspaceUrls: WorkspaceUrlsDTO;

  @Field(() => String)
  logo: string;

  @Field(() => [AvailableWorkspaceSso])
  sso: AvailableWorkspaceSso[];

  @Field(() => String, { nullable: true })
  personalInviteToken?: string;

  @Field(() => String, { nullable: true })
  inviteHash?: string;

  @Field(() => String, { nullable: true })
  loginToken?: string;
}

@ObjectType('AvailableWorkspaces')
export class AvailableWorkspaces {
  @Field(() => [AvailableWorkspace])
  availableWorkspacesForSignUp: AvailableWorkspace[];

  @Field(() => [AvailableWorkspace])
  availableWorkspacesForSignIn: AvailableWorkspace[];
}
