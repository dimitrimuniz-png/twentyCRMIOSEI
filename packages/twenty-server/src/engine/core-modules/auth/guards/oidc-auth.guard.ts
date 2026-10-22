import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { type Request } from 'express';
import { isDefined } from 'twenty-shared/utils';

import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';
import { SsoService } from 'src/engine/core-modules/sso/services/sso.service';

@Injectable()
export class OidcAuthGuard extends AuthGuard('openidconnect') {
  constructor(
    private readonly ssoService: SsoService,
    private readonly guardRedirectService: GuardRedirectService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const identityProviderId = request.params.identityProviderId;

    if (!isDefined(identityProviderId) || identityProviderId.length === 0) {
      await this.reject(context, undefined);

      return false;
    }

    const identityProvider =
      await this.ssoService.findSsoIdentityProviderById(identityProviderId);

    if (!isDefined(identityProvider)) {
      await this.reject(context, undefined);

      return false;
    }

    await this.ssoService.discoverOidcIssuer(identityProvider.issuer);

    return (await super.canActivate(context)) as boolean;
  }

  private async reject(
    context: ExecutionContext,
    workspace: { id?: string } | undefined,
  ): Promise<void> {
    const domains = isDefined(workspace)
      ? await this.workspaceDomainsService.getSubdomainAndCustomDomainFromWorkspaceFallbackOnDefaultSubdomain(
          workspace as never,
        )
      : { id: undefined, subdomain: '', customDomain: null };

    this.guardRedirectService.dispatchErrorFromGuard(
      context,
      new Error('SSO identity provider not found'),
      domains,
    );
  }
}
