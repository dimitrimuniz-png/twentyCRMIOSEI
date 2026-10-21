import {
  type RecordShareAccessLevel,
  type RecordSharePrincipalType,
  type RecordShareRowCause,
} from 'twenty-shared/types';

export type RecordShare = {
  id: string;
  recordId: string;
  objectMetadataId: string;
  principalId: string;
  principalType: RecordSharePrincipalType;
  accessLevel: RecordShareAccessLevel;
  rowCause: RecordShareRowCause;
  sourceId: string;
};
