import { BadRequestException } from '@nestjs/common';

import { type RecordShareException } from 'src/engine/core-modules/record-share/record-share.exception';

export const recordShareRestApiExceptionHandler = (
  error: RecordShareException,
): never => {
  throw new BadRequestException(error.message);
};
