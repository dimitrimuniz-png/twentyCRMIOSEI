import { type RowAccessExpression } from 'src/engine/twenty-orm/types/row-access-policy.type';

export const isRowAccessExpressionReadingRoleFilter = (
  expression: RowAccessExpression,
): boolean => {
  switch (expression.kind) {
    case 'roleFilter':
      return true;
    case 'and':
    case 'or':
      return expression.operands.some(isRowAccessExpressionReadingRoleFilter);
    case 'inheritedReadability':
      return expression.parents.some(
        (parent) =>
          parent.policy.kind === 'gated' &&
          isRowAccessExpressionReadingRoleFilter(parent.policy.expression),
      );
    case 'recordShared':
    case 'recordNotRestricted':
      return false;
    default:
      return false;
  }
};
