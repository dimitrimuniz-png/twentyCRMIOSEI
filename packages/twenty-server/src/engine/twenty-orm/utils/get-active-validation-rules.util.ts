import { isDefined } from 'twenty-shared/utils';

type ValidationRuleRecord = {
  objectMetadataId: string;
  isActive?: boolean;
  deletedAt?: string | null;
  expression: string;
  message: string;
  name?: string;
  errorFieldMetadataId?: string | null;
};

type ValidationRuleMaps = {
  byUniversalIdentifier?: Partial<Record<string, ValidationRuleRecord>>;
};

export const getActiveValidationRules = ({
  flatValidationRuleMaps,
  objectMetadataId,
}: {
  flatValidationRuleMaps?: ValidationRuleMaps;
  objectMetadataId: string;
}): ValidationRuleRecord[] =>
  Object.values(flatValidationRuleMaps?.byUniversalIdentifier ?? {}).filter(
    (rule): rule is ValidationRuleRecord =>
      isDefined(rule) &&
      rule.objectMetadataId === objectMetadataId &&
      rule.isActive !== false &&
      !isDefined(rule.deletedAt),
  );
