import { type WorkspaceSsoIdentityProviderEntity } from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';

export type SsoConfiguration = Pick<
  WorkspaceSsoIdentityProviderEntity,
  | 'id'
  | 'issuer'
  | 'type'
  | 'clientId'
  | 'clientSecret'
  | 'certificate'
  | 'ssoUrl'
>;
