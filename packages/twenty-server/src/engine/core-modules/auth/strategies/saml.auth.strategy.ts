import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';

import { type Request } from 'express';
import { MultiSamlStrategy } from '@node-saml/passport-saml';
import { Repository } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceSsoIdentityProviderEntity } from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';

export type SamlRequest = Request & {
  user: {
    identityProviderId: string;
    email: string;
  };
};

@Injectable()
export class SamlAuthStrategy extends PassportStrategy(MultiSamlStrategy, 'saml') {
  constructor(
    @InjectRepository(WorkspaceSsoIdentityProviderEntity)
    identityProviderRepository: Repository<WorkspaceSsoIdentityProviderEntity>,
    twentyConfigService: TwentyConfigService,
  ) {
    super(
      {
        passReqToCallback: true,
        getSamlOptions: (request, done) => {
          const identityProviderId = request.params.identityProviderId;

          void identityProviderRepository
            .findOne({ where: { id: identityProviderId } })
            .then((identityProvider) => {
              if (!isDefined(identityProvider?.ssoUrl) || !isDefined(identityProvider.certificate)) {
                done(new Error('SAML identity provider is not configured'));

                return;
              }

              const serverUrl = twentyConfigService.get('SERVER_URL').replace(/\/$/, '');

              done(null, {
                entryPoint: identityProvider.ssoUrl,
                issuer: identityProvider.issuer,
                idpCert: identityProvider.certificate,
                callbackUrl: `${serverUrl}/auth/saml/callback/${identityProvider.id}`,
                wantAssertionsSigned: true,
              });
            })
            .catch((error: Error) => done(error));
        },
      },
      (request, profile, done) => {
        const email = profile?.nameID;

        if (!isDefined(email)) {
          done(new Error('SAML response did not include an email'));

          return;
        }

        done(null, {
          email: email.toLowerCase(),
          identityProviderId: request.params.identityProviderId,
        });
      },
      (_request, _profile, done) => done(null),
    );
  }
}
