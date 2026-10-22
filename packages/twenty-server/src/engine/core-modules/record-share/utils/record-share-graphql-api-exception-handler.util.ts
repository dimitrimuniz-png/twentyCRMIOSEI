import { RecordShareException } from 'src/engine/core-modules/record-share/record-share.exception';
import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';

export const recordShareGraphqlApiExceptionHandler = (
  error: RecordShareException,
): never => {
  throw new UserInputError(error);
};
