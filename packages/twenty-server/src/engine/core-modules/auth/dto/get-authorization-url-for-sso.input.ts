import { Field, InputType } from '@nestjs/graphql';

@InputType('GetAuthorizationUrlForSSOInput')
export class GetAuthorizationUrlForSsoInput {
  @Field()
  identityProviderId: string;

  @Field({ nullable: true })
  workspaceInviteHash?: string;
}
