import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { type Response } from 'express';
import { ApiPath, AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { OidcAuthGuard } from 'src/engine/core-modules/auth/guards/oidc-auth.guard';
import { SamlAuthGuard } from 'src/engine/core-modules/auth/guards/saml-auth.guard';
import { AuthService } from 'src/engine/core-modules/auth/services/auth.service';
import { type SamlRequest } from 'src/engine/core-modules/auth/strategies/saml.auth.strategy';
import { assertEmailDomainIsAllowed } from 'src/engine/core-modules/auth/utils/assert-email-domain-is-allowed.util';
import { getSsoCallbackErrorCode } from 'src/engine/core-modules/auth/utils/get-sso-callback-error-code.util';
import { LoginTokenService } from 'src/engine/core-modules/auth/token/services/login-token.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller(ApiPath.Auth)
@UseFilters(AuthRestApiExceptionFilter)
export class SsoAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly loginTokenService: LoginTokenService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly domainServerConfigService: DomainServerConfigService,
  ) {}

  @Get('saml/login/:identityProviderId')
  @UseGuards(SamlAuthGuard, PublicEndpointGuard, NoPermissionGuard)
  async samlAuth(): Promise<void> {
    return;
  }

  @Get('saml/metadata/:identityProviderId')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async generateMetadata(
    @Param('identityProviderId') identityProviderId: string,
    @Res() response: Response,
  ): Promise<void> {
    const serverUrl = this.twentyConfigService
      .get('SERVER_URL')
      .replace(/\/$/, '');
    const entityId = escapeXml(
      `${serverUrl}/auth/saml/metadata/${identityProviderId}`,
    );
    const assertionConsumerUrl = escapeXml(
      `${serverUrl}/auth/saml/callback/${identityProviderId}`,
    );

    response.type('application/samlmetadata+xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor entityID="${entityId}" xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="false" WantAssertionsSigned="true">
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${assertionConsumerUrl}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`,
    );
  }

  @Post('saml/callback/:identityProviderId')
  @UseGuards(SamlAuthGuard, PublicEndpointGuard, NoPermissionGuard)
  async samlAuthCallback(
    @Req() request: SamlRequest,
    @Res() response: Response,
  ): Promise<void> {
    await this.finishSsoSignIn(request, response);
  }

  @Get('oidc/login/:identityProviderId')
  @UseGuards(OidcAuthGuard, PublicEndpointGuard, NoPermissionGuard)
  async oidcAuth(): Promise<void> {
    return;
  }

  @Get('oidc/callback/:identityProviderId')
  @UseGuards(OidcAuthGuard, PublicEndpointGuard, NoPermissionGuard)
  async oidcAuthCallback(
    @Req() request: SamlRequest,
    @Res() response: Response,
  ): Promise<void> {
    await this.finishSsoSignIn(request, response);
  }

  private async finishSsoSignIn(
    request: SamlRequest,
    response: Response,
  ): Promise<void> {
    try {
      await this.completeSsoSignIn(request, response);
    } catch (error) {
      if (response.headersSent) {
        throw error;
      }

      const redirectUrl = this.domainServerConfigService.buildBaseUrl({
        pathname: AppPath.SignInUp,
        searchParams: { ssoError: getSsoCallbackErrorCode(error) },
      });

      response.redirect(redirectUrl.toString());
    }
  }

  private async completeSsoSignIn(
    request: SamlRequest,
    response: Response,
  ): Promise<void> {
    const email = request.user.email.toLowerCase();

    assertEmailDomainIsAllowed({
      email,
      allowedDomains: this.twentyConfigService.get('SSO_ALLOWED_EMAIL_DOMAINS'),
    });

    const existingUser = await this.userService.findUserByEmail(email);
    const formattedUser = this.authService.formatUserDataPayload(
      { email, isEmailAlreadyVerified: true },
      existingUser,
    );
    const workspace = await this.authService.findWorkspaceForSignInUp({
      authProvider: AuthProviderEnum.SSO,
      email,
    });
    const invitation = isDefined(workspace)
      ? await this.authService.findInvitationForSignInUp({
          currentWorkspace: workspace,
          email,
        })
      : undefined;
    const signedIn = await this.authService.signInUp({
      ...formattedUser,
      workspace,
      invitation,
      authParams: { provider: AuthProviderEnum.SSO },
    });

    if (
      isDefined(existingUser) &&
      existingUser.isEmailVerified === false &&
      !isDefined(existingUser.passwordHash)
    ) {
      await this.userService.markEmailAsVerified(existingUser.id);
    }

    const loginToken = await this.loginTokenService.generateLoginToken(
      email,
      signedIn.workspace.id,
      AuthProviderEnum.SSO,
    );

    response.redirect(
      this.authService.computeRedirectURI({
        loginToken: loginToken.token,
        workspace: signedIn.workspace,
      }),
    );
  }
}

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return character;
    }
  });
