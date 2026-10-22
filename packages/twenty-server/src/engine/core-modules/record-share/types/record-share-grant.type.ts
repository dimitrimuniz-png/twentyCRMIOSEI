import { type RecordShareAccessLevel } from 'twenty-shared/types';

export type RecordShareGrant = {
  recordId: string;
  principalId: string;
  accessLevel: RecordShareAccessLevel;
};
