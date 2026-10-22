jest.mock('src/engine/core-modules/auth/services/auth.service', () => ({
  AuthService: class AuthService {},
}));

jest.mock('src/engine/core-modules/user/services/user.service', () => ({
  UserService: class UserService {},
}));

import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { type Response } from 'express';
import { type Repository } from 'typeorm';

import { AuthExceptionCode } from 'src/engine/core-modules/auth/auth.exception';
import { SsoAuthController } from 'src/engine/core-modules/auth/controllers/sso-auth.controller';
import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { EnterpriseFeaturesEnabledGuard } from 'src/engine/core-modules/auth/guards/enterprise-features-enabled.guard';
import { OidcAuthGuard } from 'src/engine/core-modules/auth/guards/oidc-auth.guard';
import { SamlAuthGuard } from 'src/engine/core-modules/auth/guards/saml-auth.guard';
import { AuthService } from 'src/engine/core-modules/auth/services/auth.service';
import { type SamlRequest } from 'src/engine/core-modules/auth/strategies/saml.auth.strategy';
import { LoginTokenService } from 'src/engine/core-modules/auth/token/services/login-token.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';
import { SsoService } from 'src/engine/core-modules/sso/services/sso.service';
import {
  IdentityProviderType,
  SsoIdentityProviderStatus,
  WorkspaceSsoIdentityProviderEntity,
} from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { type UserEntity } from 'src/engine/core-modules/user/user.entity';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

const WORKSPACE_ID = 'workspace-id';
const IDENTITY_PROVIDER_ID = 'identity-provider-id';
const EMAIL = 'user@example.com';

const workspace = { id: WORKSPACE_ID };

const identityProvider = {
  id: IDENTITY_PROVIDER_ID,
  type: IdentityProviderType.SAML,
  status: SsoIdentityProviderStatus.Active,
  workspaceId: WORKSPACE_ID,
  workspace,
};

const buildSamlRequest = () =>
  ({
    user: { identityProviderId: IDENTITY_PROVIDER_ID, email: EMAIL },
  }) as SamlRequest;

const buildResponse = () => ({ redirect: jest.fn() }) as unknown as Response;

describe('SsoAuthController', () => {
  let controller: SsoAuthController;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UserService>;
  let twentyConfigService: { get: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SsoAuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            findWorkspaceForSignInUp: jest.fn().mockResolvedValue(workspace),
            findInvitationForSignInUp: jest.fn().mockResolvedValue(undefined),
            formatUserDataPayload: jest.fn((newUserPayload, existingUser) => ({
              userData: existingUser
                ? { type: 'existingUser', existingUser }
                : { type: 'newUser', newUserPayload },
            })),
            checkAccessForSignIn: jest.fn().mockResolvedValue(undefined),
            signInUp: jest.fn(),
            createSsoConnectedAccountIfFeatureFlagIsOn: jest
              .fn()
              .mockResolvedValue(undefined),
            computeRedirectURI: jest.fn().mockReturnValue('https://redirect'),
          },
        },
        {
          provide: UserService,
          useValue: {
            findUserByEmail: jest.fn(),
            markEmailAsVerified: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: LoginTokenService,
          useValue: {
            generateLoginToken: jest
              .fn()
              .mockResolvedValue({ token: 'login-token' }),
          },
        },
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SSO_ALLOWED_EMAIL_DOMAINS') {
                return [];
              }

              return 'http://localhost:3000';
            }),
          },
        },
        { provide: GuardRedirectService, useValue: {} },
        { provide: WorkspaceDomainsService, useValue: {} },
        { provide: SsoService, useValue: {} },
        {
          provide: getRepositoryToken(WorkspaceSsoIdentityProviderEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(identityProvider),
          } as Partial<Repository<WorkspaceSsoIdentityProviderEntity>>,
        },
      ],
    })
      .overrideGuard(EnterpriseFeaturesEnabledGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SamlAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OidcAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PublicEndpointGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(NoPermissionGuard)
      .useValue({ canActivate: () => true })
      .overrideFilter(AuthRestApiExceptionFilter)
      .useValue({ catch: jest.fn() })
      .compile();

    controller = module.get(SsoAuthController);
    authService = module.get(AuthService);
    userService = module.get(UserService);
    twentyConfigService = module.get(TwentyConfigService);
  });

  it('creates a new SSO user with an already verified email', async () => {
    const createdUser = {
      id: 'new-user-id',
      email: EMAIL,
      isEmailVerified: true,
    } as UserEntity;

    userService.findUserByEmail.mockResolvedValue(null);
    authService.signInUp.mockResolvedValue({
      workspace,
      user: createdUser,
    } as Awaited<ReturnType<AuthService['signInUp']>>);

    const response = buildResponse();

    await controller.samlAuthCallback(buildSamlRequest(), response);

    expect(authService.formatUserDataPayload).toHaveBeenCalledWith(
      expect.objectContaining({ email: EMAIL, isEmailAlreadyVerified: true }),
      null,
    );
    expect(userService.markEmailAsVerified).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith('https://redirect');
  });

  it('marks an existing password-less unverified user as verified after an SSO sign-in', async () => {
    const existingUser = {
      id: 'existing-user-id',
      email: EMAIL,
      isEmailVerified: false,
      passwordHash: null,
    } as unknown as UserEntity;

    userService.findUserByEmail.mockResolvedValue(existingUser);
    authService.signInUp.mockResolvedValue({
      workspace,
      user: existingUser,
    } as Awaited<ReturnType<AuthService['signInUp']>>);

    const response = buildResponse();

    await controller.samlAuthCallback(buildSamlRequest(), response);

    expect(userService.markEmailAsVerified).toHaveBeenCalledWith(
      existingUser.id,
    );
    expect(response.redirect).toHaveBeenCalledWith('https://redirect');
  });

  it('does not mark an existing unverified user who has a password', async () => {
    const existingUser = {
      id: 'existing-user-id',
      email: EMAIL,
      isEmailVerified: false,
      passwordHash: 'password-hash',
    } as UserEntity;

    userService.findUserByEmail.mockResolvedValue(existingUser);
    authService.signInUp.mockResolvedValue({
      workspace,
      user: existingUser,
    } as Awaited<ReturnType<AuthService['signInUp']>>);

    await controller.samlAuthCallback(buildSamlRequest(), buildResponse());

    expect(userService.markEmailAsVerified).not.toHaveBeenCalled();
  });

  it('does not touch an existing user whose email is already verified', async () => {
    const existingUser = {
      id: 'existing-user-id',
      email: EMAIL,
      isEmailVerified: true,
    } as UserEntity;

    userService.findUserByEmail.mockResolvedValue(existingUser);
    authService.signInUp.mockResolvedValue({
      workspace,
      user: existingUser,
    } as Awaited<ReturnType<AuthService['signInUp']>>);

    await controller.samlAuthCallback(buildSamlRequest(), buildResponse());

    expect(userService.markEmailAsVerified).not.toHaveBeenCalled();
  });

  it('rejects an SSO callback when the email domain is outside the allowlist', async () => {
    twentyConfigService.get.mockImplementation((key: string) => {
      if (key === 'SSO_ALLOWED_EMAIL_DOMAINS') {
        return ['iosei.co', 'mstecnologia.med.br', 'i-rad.co'];
      }

      return 'http://localhost:3000';
    });

    const response = buildResponse();

    await expect(
      controller.oidcAuthCallback(
        {
          user: {
            identityProviderId: IDENTITY_PROVIDER_ID,
            email: 'Person@gmail.com',
          },
        } as SamlRequest,
        response,
      ),
    ).rejects.toMatchObject({
      message: 'Email domain is not allowed',
      code: AuthExceptionCode.FORBIDDEN_EXCEPTION,
    });

    expect(authService.signInUp).not.toHaveBeenCalled();
    expect(response.redirect).not.toHaveBeenCalled();
  });

  it('accepts an SSO callback for an allowed domain', async () => {
    twentyConfigService.get.mockImplementation((key: string) => {
      if (key === 'SSO_ALLOWED_EMAIL_DOMAINS') {
        return ['iosei.co', 'mstecnologia.med.br', 'i-rad.co'];
      }

      return 'http://localhost:3000';
    });
    userService.findUserByEmail.mockResolvedValue(null);
    authService.signInUp.mockResolvedValue({
      workspace,
      user: { id: 'new-user-id', email: 'ana@iosei.co' } as UserEntity,
    } as Awaited<ReturnType<AuthService['signInUp']>>);

    await controller.samlAuthCallback(
      {
        user: {
          identityProviderId: IDENTITY_PROVIDER_ID,
          email: 'Ana@Iosei.co',
        },
      } as SamlRequest,
      buildResponse(),
    );

    expect(authService.signInUp).toHaveBeenCalled();
  });
});
