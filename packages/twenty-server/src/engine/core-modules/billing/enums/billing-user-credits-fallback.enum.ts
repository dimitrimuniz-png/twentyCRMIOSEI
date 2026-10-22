import { registerEnumType } from '@nestjs/graphql';

export enum UserCreditsFallback {
  STOP = 'STOP',
  WORKSPACE_CREDITS = 'WORKSPACE_CREDITS',
}

registerEnumType(UserCreditsFallback, { name: 'UserCreditsFallback' });
