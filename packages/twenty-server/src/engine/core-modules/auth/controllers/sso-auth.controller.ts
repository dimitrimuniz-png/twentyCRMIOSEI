import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { type Response } from 'express';
import { ApiPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { OidcAuthGuard } from 'src/engine/core-modules/auth/guards/oidc-auth.guard';
import { SamlAuthGuard } from 'src/engine/core-modules/auth/guards/saml-auth.guard';
import { AuthService } from 'src/engine/core-modules/auth/services/auth.service';
import { type SamlRequest } from 'src/engine/core-modules/auth/strategies/saml.auth.strategy';
import { LoginTokenService } from 'src/engine/core-modules/auth/token/services/login-token.service';
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
  ) {}

  @Get('saml/login/:identityProviderId')
  @UseGuards(SamlAuthGuard, PublicEndpointGuard, NoPermissionGuard)
  async samlLogin(): Promise<void> {
    return;
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
  async oidcLogin(): Promise<void> {
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
    const email = request.user.email.toLowerCase();
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
