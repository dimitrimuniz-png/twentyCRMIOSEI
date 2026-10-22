import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

export enum RowLevelPermissionPredicateExceptionCode {
  ROW_LEVEL_PERMISSION_FEATURE_DISABLED = 'ROW_LEVEL_PERMISSION_FEATURE_DISABLED',
  ROW_LEVEL_PERMISSION_PREDICATE_NOT_FOUND = 'ROW_LEVEL_PERMISSION_PREDICATE_NOT_FOUND',
  INVALID_ROW_LEVEL_PERMISSION_PREDICATE_DATA = 'INVALID_ROW_LEVEL_PERMISSION_PREDICATE_DATA',
  UNAUTHORIZED_ROLE_MODIFICATION = 'UNAUTHORIZED_ROLE_MODIFICATION',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

const getRowLevelPermissionPredicateUserFriendlyMessage = (
  code: RowLevelPermissionPredicateExceptionCode,
): MessageDescriptor => {
  switch (code) {
    case RowLevelPermissionPredicateExceptionCode.ROW_LEVEL_PERMISSION_FEATURE_DISABLED:
      return msg`Record-level permissions are disabled.`;
    case RowLevelPermissionPredicateExceptionCode.ROW_LEVEL_PERMISSION_PREDICATE_NOT_FOUND:
      return msg`Record-level permission rule not found.`;
    case RowLevelPermissionPredicateExceptionCode.INVALID_ROW_LEVEL_PERMISSION_PREDICATE_DATA:
      return msg`This record-level permission rule is invalid.`;
    case RowLevelPermissionPredicateExceptionCode.UNAUTHORIZED_ROLE_MODIFICATION:
      return msg`You cannot edit this record-level permission rule.`;
    case RowLevelPermissionPredicateExceptionCode.INTERNAL_SERVER_ERROR:
      return msg`An error occurred.`;
    default:
      assertUnreachable(code);
  }
};

export class RowLevelPermissionPredicateException extends CustomException<RowLevelPermissionPredicateExceptionCode> {
  constructor(
    message: string,
    code: RowLevelPermissionPredicateExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ??
        getRowLevelPermissionPredicateUserFriendlyMessage(code),
    });
  }
}
