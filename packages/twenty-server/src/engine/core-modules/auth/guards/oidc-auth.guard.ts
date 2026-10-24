import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { type Request, type Response } from 'express';
import { isNonEmptyString } from '@sniptt/guards';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { getSsoCallbackErrorCode } from 'src/engine/core-modules/auth/utils/get-sso-callback-error-code.util';
import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { SsoService } from 'src/engine/core-modules/sso/services/sso.service';

@Injectable()
export class OidcAuthGuard extends AuthGuard('openidconnect') {
  constructor(
    private readonly ssoService: SsoService,
    private readonly domainServerConfigService: DomainServerConfigService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const identityProviderId = request.params.identityProviderId;

      if (!isNonEmptyString(identityProviderId)) {
        this.redirectSsoFailure(context);

        return false;
      }

      const identityProvider =
        await this.ssoService.findSsoIdentityProviderById(identityProviderId);

      if (!isDefined(identityProvider)) {
        this.redirectSsoFailure(context);

        return false;
      }

      // Login has no code yet and must continue to the identity provider.
      // A callback without a code is a failed return, not a new authorization.
      if (
        this.isOidcCallback(request) &&
        !isNonEmptyString(request.query.code)
      ) {
        this.redirectSsoFailure(context);

        return false;
      }

      await this.ssoService.discoverOidcIssuer(identityProvider.issuer);

      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      this.redirectSsoFailure(context, error);

      return false;
    }
  }

  private isOidcCallback(request: Request): boolean {
    const requestPath = `${request.originalUrl ?? ''} ${request.path ?? ''}`;

    return requestPath.includes('/oidc/callback/');
  }

  private redirectSsoFailure(context: ExecutionContext, error?: unknown): void {
    const response = context.switchToHttp().getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    const redirectUrl = this.domainServerConfigService.buildBaseUrl({
      pathname: AppPath.SignInUp,
      searchParams: { ssoError: getSsoCallbackErrorCode(error) },
    });

    response.redirect(redirectUrl.toString());
  }
}
