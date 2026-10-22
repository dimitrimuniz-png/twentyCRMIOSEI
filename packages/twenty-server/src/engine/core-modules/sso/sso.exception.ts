import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { CustomException } from 'src/utils/custom-exception';

export enum SsoExceptionCode {
  IDENTITY_PROVIDER_ALREADY_EXISTS = 'IDENTITY_PROVIDER_ALREADY_EXISTS',
}

const SSO_EXCEPTION_USER_FRIENDLY_MESSAGE: Record<
  SsoExceptionCode,
  MessageDescriptor
> = {
  [SsoExceptionCode.IDENTITY_PROVIDER_ALREADY_EXISTS]: msg`Identity provider already exists.`,
};

export class SsoException extends CustomException<SsoExceptionCode> {
  constructor(message: string, code: SsoExceptionCode) {
    super(message, code, {
      userFriendlyMessage: SSO_EXCEPTION_USER_FRIENDLY_MESSAGE[code],
    });
  }
}
