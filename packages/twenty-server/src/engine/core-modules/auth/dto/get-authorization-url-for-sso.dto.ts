import { Field, ObjectType } from '@nestjs/graphql';

import { IdentityProviderType } from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';

@ObjectType('GetAuthorizationUrlForSSO')
export class GetAuthorizationUrlForSsoDTO {
  @Field()
  id: string;

  @Field(() => IdentityProviderType)
  type: IdentityProviderType;

  @Field()
  authorizationURL: string;
}
