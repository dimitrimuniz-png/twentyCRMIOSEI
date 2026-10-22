import { msg } from '@lingui/core/macro';
import { RecordSharePrincipalType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import {
  RecordShareException,
  RecordShareExceptionCode,
} from 'src/engine/core-modules/record-share/record-share.exception';

export const resolveRecordSharePrincipalOrThrow = (principal: {
  workspaceMemberId?: string;
  roleId?: string;
}): {
  principalId: string;
  principalType: RecordSharePrincipalType;
} => {
  if (isDefined(principal.workspaceMemberId)) {
    return {
      principalId: principal.workspaceMemberId,
      principalType: RecordSharePrincipalType.WORKSPACE_MEMBER,
    };
  }

  if (isDefined(principal.roleId)) {
    return {
      principalId: principal.roleId,
      principalType: RecordSharePrincipalType.ROLE,
    };
  }

  throw new RecordShareException(
    'A share must name a workspace member or a role',
    RecordShareExceptionCode.INVALID_SHARE_WITH,
    { userFriendlyMessage: msg`Choose who to share this record with.` },
  );
};
