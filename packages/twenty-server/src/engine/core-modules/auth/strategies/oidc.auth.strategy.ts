import { Injectable, type OnModuleInit } from '@nestjs/common';

import { type Request } from 'express';
import passport from 'passport';
import { Strategy } from 'passport-strategy';
import { isDefined } from 'twenty-shared/utils';

import { isOidcEmailVerifiedClaim } from 'src/engine/core-modules/auth/utils/is-oidc-email-verified-claim.util';
import { SsoService } from 'src/engine/core-modules/sso/services/sso.service';

type OidcStrategyInstance = Strategy & {
  success: (user: unknown) => void;
  fail: (challenge: string, status: number) => void;
  redirect: (url: string) => void;
  error: (error: Error) => void;
};

class OidcPassportStrategy extends Strategy {
  name = 'openidconnect';

  constructor(private readonly ssoService: SsoService) {
    super();
  }

  authenticate(request: Request): void {
    void this.signIn(request, this as unknown as OidcStrategyInstance);
  }

  private async signIn(
    request: Request,
    strategy: OidcStrategyInstance,
  ): Promise<void> {
    try {
      const identityProviderId = request.params.identityProviderId;
      const identityProvider =
        await this.ssoService.findSsoIdentityProviderById(identityProviderId);

      if (!isDefined(identityProvider)) {
        strategy.fail('SSO identity provider not found', 401);

        return;
      }

      const client = await this.ssoService.getOidcClient(identityProvider);
      const redirectUri = client.metadata.redirect_uris?.[0];

      if (!isDefined(request.query.code)) {
        strategy.redirect(
          client.authorizationUrl({
            scope: 'openid email profile',
            redirect_uri: redirectUri,
          }),
        );

        return;
      }

      const tokenSet = await client.callback(
        redirectUri,
        client.callbackParams(request),
      );

      if (!isDefined(tokenSet.access_token)) {
        strategy.fail('OIDC response did not include an access token', 401);

        return;
      }

      const userInfo = await client.userinfo(tokenSet.access_token);
      const email = userInfo.email;

      if (typeof email !== 'string') {
        strategy.fail('OIDC response did not include an email', 401);

        return;
      }

      if (!isOidcEmailVerifiedClaim(userInfo.email_verified)) {
        strategy.fail('OIDC email is not verified', 401);

        return;
      }

      strategy.success({
        email: email.toLowerCase(),
        identityProviderId,
      });
    } catch (error) {
      strategy.error(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

@Injectable()
export class OidcAuthStrategy implements OnModuleInit {
  constructor(private readonly ssoService: SsoService) {}

  onModuleInit(): void {
    passport.use(new OidcPassportStrategy(this.ssoService));
  }
}
