import { FieldMetadataType } from 'twenty-shared/types';

import { RecordValidationRuleException } from 'src/engine/metadata-modules/validation-rule/exceptions/record-validation-rule.exception';
import { getActiveValidationRules } from 'src/engine/twenty-orm/utils/get-active-validation-rules.util';
import { validateRecordsAgainstValidationRulesOrThrow } from 'src/engine/twenty-orm/utils/validate-records-against-validation-rules.util';

const fields = [
  {
    name: 'stage',
    type: FieldMetadataType.SELECT,
    universalIdentifier: 'stage',
  },
  {
    name: 'amount',
    type: FieldMetadataType.CURRENCY,
    universalIdentifier: 'amount',
  },
];

describe('validation rules', () => {
  it('keeps only active rules of the object', () => {
    expect(
      getActiveValidationRules({
        objectMetadataId: 'opportunity',
        flatValidationRuleMaps: {
          byUniversalIdentifier: {
            active: {
              objectMetadataId: 'opportunity',
              isActive: true,
              expression: 'true',
              message: 'keep',
            },
            inactive: {
              objectMetadataId: 'opportunity',
              isActive: false,
              expression: 'true',
              message: 'drop',
            },
            other: {
              objectMetadataId: 'company',
              expression: 'true',
              message: 'drop',
            },
          },
        },
      }).map((rule) => rule.message),
    ).toEqual(['keep']);
  });

  it('rejects a record that fails an admin-defined expression', async () => {
    await expect(
      validateRecordsAgainstValidationRulesOrThrow({
        validationRules: [
          {
            expression: 'stage != "WON" or not isEmpty(amount)',
            message: 'Won opportunities need an amount',
            name: 'won-needs-amount',
          },
        ],
        writtenRecords: [{ stage: 'WON', amount: null }],
        fields,
      }),
    ).rejects.toBeInstanceOf(RecordValidationRuleException);
  });

  it('accepts a record that satisfies the expression', async () => {
    await expect(
      validateRecordsAgainstValidationRulesOrThrow({
        validationRules: [
          {
            expression: 'stage != "WON" or not isEmpty(amount)',
            message: 'Won opportunities need an amount',
          },
        ],
        writtenRecords: [{ stage: 'OPEN', amount: null }],
        fields,
      }),
    ).resolves.toBeUndefined();
  });
});
