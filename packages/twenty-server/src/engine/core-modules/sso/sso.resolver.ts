import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
} from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { SsoService } from 'src/engine/core-modules/sso/services/sso.service';
import {
  IdentityProviderType,
  SsoIdentityProviderStatus,
  WorkspaceSsoIdentityProviderEntity,
} from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@InputType('SetupSAMLSsoInput')
class SetupSamlSsoInput {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  issuer: string;

  @Field()
  certificate: string;

  @Field()
  ssoURL: string;

  @Field({ nullable: true })
  fingerprint?: string;
}

@InputType('SetupOIDCSsoInput')
class SetupOidcSsoInput {
  @Field()
  name: string;

  @Field()
  issuer: string;

  @Field()
  clientID: string;

  @Field()
  clientSecret: string;
}

@InputType('EditSsoInput')
class EditSsoInput {
  @Field()
  id: string;

  @Field(() => SsoIdentityProviderStatus)
  status: SsoIdentityProviderStatus;
}

@InputType('DeleteSsoInput')
class DeleteSsoInput {
  @Field()
  identityProviderId: string;
}

@ObjectType('SetupSso')
class SetupSso {
  @Field()
  id: string;

  @Field(() => IdentityProviderType)
  type: IdentityProviderType;

  @Field()
  issuer: string;

  @Field()
  name: string;

  @Field(() => SsoIdentityProviderStatus)
  status: SsoIdentityProviderStatus;
}

@ObjectType('WorkspaceNameAndId')
class WorkspaceNameAndId {
  @Field()
  id: string;

  @Field({ nullable: true })
  displayName?: string;
}

@ObjectType('FindAvailableSSOIDP')
class FindAvailableSsoIdp extends SetupSso {
  @Field(() => WorkspaceNameAndId)
  workspace: WorkspaceNameAndId;
}

@ObjectType('EditSso')
class EditSso {
  @Field()
  id: string;

  @Field(() => IdentityProviderType)
  type: IdentityProviderType;

  @Field()
  issuer: string;

  @Field()
  name: string;

  @Field(() => SsoIdentityProviderStatus)
  status: SsoIdentityProviderStatus;
}

@ObjectType('DeleteSso')
class DeleteSso {
  @Field()
  identityProviderId: string;
}

@MetadataResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: true,
    application: true,
  }),
  SettingsPermissionGuard(PermissionFlagType.SECURITY),
)
export class SsoResolver {
  constructor(private readonly ssoService: SsoService) {}

  @Query(() => [FindAvailableSsoIdp])
  async getSSOIdentityProviders(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FindAvailableSsoIdp[]> {
    const identityProviders = await this.ssoService.listForWorkspace(
      workspace.id,
    );

    return identityProviders.map((identityProvider) =>
      this.toAvailableProvider(identityProvider, workspace),
    );
  }

  @Mutation(() => SetupSso)
  async createSAMLIdentityProvider(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: SetupSamlSsoInput,
  ): Promise<SetupSso> {
    const identityProvider = await this.ssoService.createSamlIdentityProvider({
      workspaceId: workspace.id,
      id: input.id,
      name: input.name,
      issuer: input.issuer,
      certificate: input.certificate,
      ssoUrl: input.ssoURL,
    });

    return this.toSetupSso(identityProvider);
  }

  @Mutation(() => SetupSso)
  async createOIDCIdentityProvider(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: SetupOidcSsoInput,
  ): Promise<SetupSso> {
    const identityProvider = await this.ssoService.createOidcIdentityProvider({
      workspaceId: workspace.id,
      name: input.name,
      issuer: input.issuer,
      clientId: input.clientID,
      clientSecret: input.clientSecret,
    });

    return this.toSetupSso(identityProvider);
  }

  @Mutation(() => EditSso)
  async editSSOIdentityProvider(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: EditSsoInput,
  ): Promise<EditSso> {
    const identityProvider = await this.ssoService.editIdentityProvider({
      workspaceId: workspace.id,
      id: input.id,
      status: input.status,
    });

    return this.toSetupSso(identityProvider);
  }

  @Mutation(() => DeleteSso)
  async deleteSSOIdentityProvider(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: DeleteSsoInput,
  ): Promise<DeleteSso> {
    await this.ssoService.deleteIdentityProvider({
      workspaceId: workspace.id,
      id: input.identityProviderId,
    });

    return { identityProviderId: input.identityProviderId };
  }

  private toSetupSso(
    identityProvider: WorkspaceSsoIdentityProviderEntity,
  ): SetupSso {
    return {
      id: identityProvider.id,
      type: identityProvider.type,
      issuer: identityProvider.issuer,
      name: identityProvider.name,
      status: identityProvider.status,
    };
  }

  private toAvailableProvider(
    identityProvider: WorkspaceSsoIdentityProviderEntity,
    workspace: WorkspaceEntity,
  ): FindAvailableSsoIdp {
    return {
      ...this.toSetupSso(identityProvider),
      workspace: {
        id: workspace.id,
        displayName: isDefined(identityProvider.workspace)
          ? identityProvider.workspace.displayName
          : workspace.displayName,
      },
    };
  }
}
