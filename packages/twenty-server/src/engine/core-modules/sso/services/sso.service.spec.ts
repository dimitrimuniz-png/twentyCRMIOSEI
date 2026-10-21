import { IdentityProviderType } from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';
import { SsoService } from 'src/engine/core-modules/sso/services/sso.service';

describe('SsoService', () => {
  const identityProviderRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'created-id', ...value })),
    delete: jest.fn(),
  };
  const twentyConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3000/'),
  };

  const service = new SsoService(
    identityProviderRepository as never,
    twentyConfigService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    twentyConfigService.get.mockReturnValue('http://localhost:3000/');
  });

  it('builds a SAML login URL from the public server address', async () => {
    identityProviderRepository.findOne.mockResolvedValue({
      id: 'idp-id',
      type: IdentityProviderType.SAML,
    });

    await expect(
      service.getAuthorizationUrlForSSO('idp-id', {}),
    ).resolves.toEqual({
      id: 'idp-id',
      type: IdentityProviderType.SAML,
      authorizationURL: 'http://localhost:3000/auth/saml/login/idp-id',
    });
  });

  it('builds an OIDC login URL for an OIDC provider', async () => {
    identityProviderRepository.findOne.mockResolvedValue({
      id: 'oidc-id',
      type: IdentityProviderType.OIDC,
    });

    await expect(
      service.getAuthorizationUrlForSSO('oidc-id', {}),
    ).resolves.toMatchObject({
      authorizationURL: 'http://localhost:3000/auth/oidc/login/oidc-id',
      type: IdentityProviderType.OIDC,
    });
  });

  it('rejects an unknown identity provider', async () => {
    identityProviderRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getAuthorizationUrlForSSO('missing', {}),
    ).rejects.toThrow('SSO identity provider not found');
  });
});
