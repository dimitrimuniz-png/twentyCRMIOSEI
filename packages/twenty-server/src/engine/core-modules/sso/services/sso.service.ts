import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Issuer, type Client } from 'openid-client';
import { Repository } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import {
  SsoException,
  SsoExceptionCode,
} from 'src/engine/core-modules/sso/sso.exception';
import {
  IdentityProviderType,
  SsoIdentityProviderStatus,
  WorkspaceSsoIdentityProviderEntity,
} from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';

export type SsoAuthorizationUrl = {
  id: string;
  type: IdentityProviderType;
  authorizationURL: string;
};

@Injectable()
export class SsoService {
  private readonly issuerByUrl = new Map<string, Issuer>();

  constructor(
    @InjectRepository(WorkspaceSsoIdentityProviderEntity)
    private readonly identityProviderRepository: Repository<WorkspaceSsoIdentityProviderEntity>,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  async findSsoIdentityProviderById(
    identityProviderId: string,
  ): Promise<WorkspaceSsoIdentityProviderEntity | null> {
    return this.identityProviderRepository.findOne({
      where: { id: identityProviderId },
      relations: ['workspace'],
    });
  }

  async discoverOidcIssuer(issuerUrl: string): Promise<Issuer> {
    const cached = this.issuerByUrl.get(issuerUrl);

    if (isDefined(cached)) {
      return cached;
    }

    const issuer = await Issuer.discover(issuerUrl);

    this.issuerByUrl.set(issuerUrl, issuer);

    return issuer;
  }

  async getOidcClient(
    identityProvider: Pick<
      WorkspaceSsoIdentityProviderEntity,
      'id' | 'issuer' | 'clientId' | 'clientSecret'
    >,
  ): Promise<Client> {
    const issuer = await this.discoverOidcIssuer(identityProvider.issuer);

    return new issuer.Client({
      client_id: identityProvider.clientId ?? '',
      client_secret: identityProvider.clientSecret ?? '',
      redirect_uris: [this.buildCallbackUrl('oidc', identityProvider.id)],
      response_types: ['code'],
    });
  }

  async getAuthorizationUrlForSSO(
    identityProviderId: string,
    _state: { workspaceInviteHash?: string | null },
  ): Promise<SsoAuthorizationUrl> {
    const identityProvider =
      await this.findSsoIdentityProviderById(identityProviderId);

    if (!isDefined(identityProvider)) {
      throw new Error('SSO identity provider not found');
    }

    const protocol =
      identityProvider.type === IdentityProviderType.SAML ? 'saml' : 'oidc';

    return {
      id: identityProvider.id,
      type: identityProvider.type,
      authorizationURL: this.buildLoginUrl(protocol, identityProvider.id),
    };
  }

  async listForWorkspace(
    workspaceId: string,
  ): Promise<WorkspaceSsoIdentityProviderEntity[]> {
    return this.identityProviderRepository.find({
      where: { workspaceId },
      relations: ['workspace'],
    });
  }

  async createSamlIdentityProvider({
    workspaceId,
    id,
    name,
    issuer,
    certificate,
    ssoUrl,
  }: {
    workspaceId: string;
    id: string;
    name: string;
    issuer: string;
    certificate: string;
    ssoUrl: string;
  }): Promise<WorkspaceSsoIdentityProviderEntity> {
    await this.assertIdentityProviderIdIsAvailable(id);

    return this.identityProviderRepository.save(
      this.identityProviderRepository.create({
        id,
        workspaceId,
        name,
        issuer,
        certificate,
        ssoUrl,
        type: IdentityProviderType.SAML,
        status: SsoIdentityProviderStatus.Active,
      }),
    );
  }

  async createOidcIdentityProvider({
    workspaceId,
    name,
    issuer,
    clientId,
    clientSecret,
  }: {
    workspaceId: string;
    name: string;
    issuer: string;
    clientId: string;
    clientSecret: string;
  }): Promise<WorkspaceSsoIdentityProviderEntity> {
    return this.identityProviderRepository.save(
      this.identityProviderRepository.create({
        workspaceId,
        name,
        issuer,
        clientId,
        clientSecret,
        type: IdentityProviderType.OIDC,
        status: SsoIdentityProviderStatus.Active,
      }),
    );
  }

  async editIdentityProvider({
    workspaceId,
    id,
    status,
  }: {
    workspaceId: string;
    id: string;
    status: SsoIdentityProviderStatus;
  }): Promise<WorkspaceSsoIdentityProviderEntity> {
    const identityProvider = await this.identityProviderRepository.findOne({
      where: { id, workspaceId },
    });

    if (!isDefined(identityProvider)) {
      throw new Error('SSO identity provider not found');
    }

    identityProvider.status = status;

    return this.identityProviderRepository.save(identityProvider);
  }

  async deleteIdentityProvider({
    workspaceId,
    id,
  }: {
    workspaceId: string;
    id: string;
  }): Promise<void> {
    await this.identityProviderRepository.delete({ id, workspaceId });
  }

  // Integration tests still seed the legacy table. The id is global across both.
  private async assertIdentityProviderIdIsAvailable(id: string): Promise<void> {
    const [current, legacy] = await Promise.all([
      this.identityProviderRepository.findOne({ where: { id } }),
      this.identityProviderRepository.manager.query<Array<{ id: string }>>(
        `SELECT id FROM core."workspaceSSOIdentityProvider" WHERE id = $1 LIMIT 1`,
        [id],
      ),
    ]);

    if (isDefined(current) || legacy.length > 0) {
      throw new SsoException(
        'Identity provider already exists',
        SsoExceptionCode.IDENTITY_PROVIDER_ALREADY_EXISTS,
      );
    }
  }

  private buildLoginUrl(protocol: 'saml' | 'oidc', id: string): string {
    return `${this.serverUrl()}/auth/${protocol}/login/${id}`;
  }

  private buildCallbackUrl(protocol: 'saml' | 'oidc', id: string): string {
    return `${this.serverUrl()}/auth/${protocol}/callback/${id}`;
  }

  private serverUrl(): string {
    return this.twentyConfigService.get('SERVER_URL').replace(/\/$/, '');
  }
}
