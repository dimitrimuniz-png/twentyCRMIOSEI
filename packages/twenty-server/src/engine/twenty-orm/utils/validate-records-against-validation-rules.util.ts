import {
  FieldMetadataType,
  type ValidationRuleFieldDescriptor,
} from 'twenty-shared/types';
import { evaluateValidationRuleExpression } from 'twenty-shared/utils';

import { RecordValidationRuleException } from 'src/engine/metadata-modules/validation-rule/exceptions/record-validation-rule.exception';

type ValidationRuleRecord = {
  expression: string;
  message: string;
  name?: string;
  errorFieldMetadataId?: string | null;
};

type FieldSource = {
  name: string;
  type: FieldMetadataType;
  universalIdentifier: string;
};

export const validateRecordsAgainstValidationRulesOrThrow = async ({
  validationRules,
  writtenRecords,
  fields = [],
}: {
  repository?: unknown;
  tableShape?: unknown;
  validationRules: ValidationRuleRecord[];
  writtenRecords: Array<Record<string, unknown>>;
  inputRecordIds?: (string | undefined)[];
  fields?: FieldSource[];
}): Promise<void> => {
  const descriptors: ValidationRuleFieldDescriptor[] = fields.map((field) => ({
    name: field.name,
    type: field.type,
    universalIdentifier: field.universalIdentifier,
  }));
  const now = new Date().toISOString();

  for (const record of writtenRecords) {
    for (const rule of validationRules) {
      const result = evaluateValidationRuleExpression({
        expression: rule.expression,
        record,
        fields: descriptors,
        now,
      });

      if (result.status === 'passed') {
        continue;
      }

      const message =
        result.status === 'failed' ? rule.message : result.errorMessage;

      throw new RecordValidationRuleException(
        message,
        rule.name ?? 'validation-rule',
        rule.errorFieldMetadataId ?? null,
      );
    }
  }
};
