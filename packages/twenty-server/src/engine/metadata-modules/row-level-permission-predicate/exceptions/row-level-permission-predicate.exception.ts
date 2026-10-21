export class RowLevelPermissionPredicateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RowLevelPermissionPredicateException';
  }
}
