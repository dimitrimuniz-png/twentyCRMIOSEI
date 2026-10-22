import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { RecordValidationRuleException } from 'src/engine/metadata-modules/validation-rule/exceptions/record-validation-rule.exception';

export const recordValidationRuleGraphqlApiExceptionHandler = (
  error: RecordValidationRuleException,
): never => {
  throw new UserInputError(error.message, {
    subCode: 'RECORD_VALIDATION_RULE',
  });
};
