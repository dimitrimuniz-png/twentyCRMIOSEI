import { registerEnumType } from '@nestjs/graphql';

export enum UsageUnit {
  BYTE = 'BYTE',
  COMPLEXITY = 'COMPLEXITY',
  CREDIT = 'CREDIT',
  FILE = 'FILE',
  INVOCATION = 'INVOCATION',
  MILLISECOND = 'MILLISECOND',
  MINUTE = 'MINUTE',
  RECORD = 'RECORD',
  REQUEST = 'REQUEST',
  SEAT = 'SEAT',
  TOKEN = 'TOKEN',
  USER_CREDIT = 'USER_CREDIT',
}

registerEnumType(UsageUnit, { name: 'UsageUnit' });
