import { registerEnumType } from '@nestjs/graphql';

export enum RecordSharingMode {
  INHERITED = 'INHERITED',
  OPEN_BY_DEFAULT = 'OPEN_BY_DEFAULT',
  PRIVATE = 'PRIVATE',
  ROLE_ONLY = 'ROLE_ONLY',
}

registerEnumType(RecordSharingMode, { name: 'RecordSharingMode' });
