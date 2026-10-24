import { type ErrorLike } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { type MessageDescriptor } from '@lingui/core';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type Nullable } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const visibleMessage = (message: string): string =>
  isNonEmptyString(message) ? message : t`An error occurred.`;

export const getErrorMessageFromApolloError = (error: ErrorLike): string => {
  if (!CombinedGraphQLErrors.is(error)) {
    return visibleMessage(error.message ?? '');
  }

  const userFriendlyMessage = error.errors?.[0]?.extensions
    ?.userFriendlyMessage as Nullable<MessageDescriptor | string>;

  if (!isDefined(userFriendlyMessage)) {
    return t`An error occurred.`;
  }

  if (typeof userFriendlyMessage === 'object' && 'id' in userFriendlyMessage) {
    return t(userFriendlyMessage);
  }

  return visibleMessage(userFriendlyMessage);
};
