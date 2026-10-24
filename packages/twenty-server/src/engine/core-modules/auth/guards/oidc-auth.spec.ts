import { type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Test, type TestingModule } from '@nestjs/testing';

import { type Response } from 'express';
import { type Issuer } from 'openid-client';

import { AuthExceptionCode } from 'src/engine/core-modules/auth/auth.exception';
import { OidcAuthGuard } from 'src/engine/core-modules/auth/guards/oidc-auth.guard';
import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { SsoService } from 'src/engine/core-modules/sso/services/sso.service';
import { type SsoConfiguration } from 'src/engine/core-modules/sso/types/sso-configurations.type';
import { type WorkspaceSsoIdentityProviderEntity } from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';

const buildBaseUrl = ({
  pathname,
  searchParams,
}: {
  pathname?: string;
  searchParams?: Record<string, string>;
}) => {
  const url = new URL('http://localhost:3000');

  url.pathname = pathname ?? '/';

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  return url;
};

const createMockExecutionContext = (
  mockedRequest: {
    params: Record<string, string | undefined>;
    query: Record<string, string | undefined>;
    path: string;
    originalUrl?: string;
  },
  response: Pick<Response, 'redirect' | 'headersSent'>,
): ExecutionContext => {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockedRequest),
      getResponse: jest.fn().mockReturnValue(response),
    }),
  } as unknown as ExecutionContext;
};

const createMockedRequest = (
  params: Record<string, string | undefined> = {},
  query: Record<string, string | undefined> = {},
  path = '/auth/oidc/login/test-id',
) => ({
  params,
  query,
  path,
});

const createResponse = () =>
  ({
    redirect: jest.fn(),
    headersSent: false,
  }) as unknown as Pick<Response, 'redirect' | 'headersSent'> & {
    redirect: jest.Mock;
  };

const passportCanActivate = jest
  .spyOn(AuthGuard('openidconnect').prototype, 'canActivate')
  .mockResolvedValue(true);

jest.mock('openid-client', () => ({
  Strategy: jest.fn(),
}));

describe('OidcAuthGuard', () => {
  let guard: OidcAuthGuard;
  let ssoService: SsoService;

  beforeEach(async () => {
    passportCanActivate.mockReset();
    passportCanActivate.mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OidcAuthGuard,
        {
          provide: SsoService,
          useValue: {
            findSsoIdentityProviderById: jest.fn(),
            discoverOidcIssuer: jest.fn().mockResolvedValue({} as Issuer),
            getOidcClient: jest.fn(),
          },
        },
        {
          provide: DomainServerConfigService,
          useValue: { buildBaseUrl },
        },
      ],
    }).compile();

    guard = module.get<OidcAuthGuard>(OidcAuthGuard);
    ssoService = module.get<SsoService>(SsoService);
  });

  it('should activate when identity provider exists and is valid', async () => {
    const response = createResponse();
    const mockExecutionContext = createMockExecutionContext(
      createMockedRequest({ identityProviderId: 'test-id' }),
      response,
    );

    jest.spyOn(ssoService, 'findSsoIdentityProviderById').mockResolvedValue({
      id: 'test-id',
      issuer: 'https://issuer.example.com',
      workspace: {},
    } as SsoConfiguration & WorkspaceSsoIdentityProviderEntity);

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(response.redirect).not.toHaveBeenCalled();
    expect(ssoService.findSsoIdentityProviderById).toHaveBeenCalledWith(
      'test-id',
    );
    expect(ssoService.discoverOidcIssuer).toHaveBeenCalledWith(
      'https://issuer.example.com',
    );
  });

  it('should redirect to the login card when the identity provider is not found', async () => {
    const response = createResponse();
    const mockExecutionContext = createMockExecutionContext(
      createMockedRequest({ identityProviderId: 'non-existent-id' }),
      response,
    );

    jest
      .spyOn(ssoService, 'findSsoIdentityProviderById')
      .mockResolvedValue(null);

    await expect(guard.canActivate(mockExecutionContext)).resolves.toBe(false);
    expect(ssoService.findSsoIdentityProviderById).toHaveBeenCalledWith(
      'non-existent-id',
    );
    expect(response.redirect).toHaveBeenCalledWith(
      `http://localhost:3000/welcome?ssoError=${AuthExceptionCode.SSO_AUTH_FAILED}`,
    );
    expect(passportCanActivate).not.toHaveBeenCalled();
  });

  it('should redirect when the identity provider id is missing', async () => {
    const response = createResponse();
    const mockExecutionContext = createMockExecutionContext(
      createMockedRequest({ identityProviderId: undefined }),
      response,
    );

    await expect(guard.canActivate(mockExecutionContext)).resolves.toBe(false);
    expect(response.redirect).toHaveBeenCalledWith(
      `http://localhost:3000/welcome?ssoError=${AuthExceptionCode.SSO_AUTH_FAILED}`,
    );
  });

  it('should redirect a callback that is missing the authorization code', async () => {
    const response = createResponse();
    const mockExecutionContext = createMockExecutionContext(
      createMockedRequest(
        { identityProviderId: 'test-id' },
        {},
        '/auth/oidc/callback/test-id',
      ),
      response,
    );

    jest.spyOn(ssoService, 'findSsoIdentityProviderById').mockResolvedValue({
      id: 'test-id',
      issuer: 'https://accounts.google.com',
    } as SsoConfiguration & WorkspaceSsoIdentityProviderEntity);

    await expect(guard.canActivate(mockExecutionContext)).resolves.toBe(false);
    expect(passportCanActivate).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      `http://localhost:3000/welcome?ssoError=${AuthExceptionCode.SSO_AUTH_FAILED}`,
    );
  });

  it('should redirect provider errors such as a missing iss to the login card', async () => {
    const response = createResponse();
    const mockExecutionContext = createMockExecutionContext(
      createMockedRequest(
        { identityProviderId: 'test-id' },
        { code: 'bad-code' },
        '/auth/oidc/callback/test-id',
      ),
      response,
    );

    jest.spyOn(ssoService, 'findSsoIdentityProviderById').mockResolvedValue({
      id: 'test-id',
      issuer: 'https://accounts.google.com',
    } as SsoConfiguration & WorkspaceSsoIdentityProviderEntity);
    passportCanActivate.mockRejectedValue(
      new Error('iss missing from the response'),
    );

    await expect(guard.canActivate(mockExecutionContext)).resolves.toBe(false);
    expect(response.redirect).toHaveBeenCalledWith(
      `http://localhost:3000/welcome?ssoError=${AuthExceptionCode.SSO_AUTH_FAILED}`,
    );
  });

  it('should leave an identity-provider redirect already sent by passport', async () => {
    const response = createResponse();

    response.headersSent = true;
    const mockExecutionContext = createMockExecutionContext(
      createMockedRequest({ identityProviderId: 'test-id' }),
      response,
    );

    jest.spyOn(ssoService, 'findSsoIdentityProviderById').mockResolvedValue({
      id: 'test-id',
      issuer: 'https://accounts.google.com',
    } as SsoConfiguration & WorkspaceSsoIdentityProviderEntity);
    passportCanActivate.mockRejectedValue(new Error('headers already sent'));

    await expect(guard.canActivate(mockExecutionContext)).resolves.toBe(false);
    expect(response.redirect).not.toHaveBeenCalled();
  });
});
