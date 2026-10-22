import { RecordShareAccessLevel } from 'twenty-shared/types';

export const GRANTABLE_RECORD_SHARE_ACCESS_LEVELS = [
  RecordShareAccessLevel.READ,
  RecordShareAccessLevel.READ_WRITE,
  RecordShareAccessLevel.FULL,
] as const;
