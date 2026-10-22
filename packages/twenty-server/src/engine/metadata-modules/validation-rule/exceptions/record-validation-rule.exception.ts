export class RecordValidationRuleException extends Error {
  constructor(
    message: string,
    readonly ruleName: string,
    readonly errorFieldMetadataId: string | null,
  ) {
    super(message);
    this.name = 'RecordValidationRuleException';
  }
}
