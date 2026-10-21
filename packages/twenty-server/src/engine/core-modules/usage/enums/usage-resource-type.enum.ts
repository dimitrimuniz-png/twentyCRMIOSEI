import { registerEnumType } from '@nestjs/graphql';

export enum UsageResourceType {
  ALL = 'ALL',
  AI = 'AI',
  WORKFLOW = 'WORKFLOW',
  LOGIC_FUNCTION = 'LOGIC_FUNCTION',
  EMAIL = 'EMAIL',
  API = 'API',
  APP = 'APP',
  RECORD = 'RECORD',
  STORAGE = 'STORAGE',
  WEBHOOK = 'WEBHOOK',
}

registerEnumType(UsageResourceType, { name: 'UsageResourceType' });
