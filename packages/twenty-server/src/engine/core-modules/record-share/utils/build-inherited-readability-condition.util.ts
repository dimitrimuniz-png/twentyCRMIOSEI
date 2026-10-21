import { type SqlCondition } from 'src/engine/twenty-orm/types/row-access-policy.type';

type CompiledColumnParent = {
  kind: 'column';
  joinColumnName: string;
  parentTableAlias: string;
  parentTableExpression: string;
  policy: { kind: 'open' } | { kind: 'denied' } | { kind: 'gated'; condition: SqlCondition };
};

type CompiledChildrenParent = {
  kind: 'children';
  childTableAlias: string;
  childJoinColumnName: string;
  childTableExpression: string;
  policy: { kind: 'open' } | { kind: 'denied' } | { kind: 'gated'; condition: SqlCondition };
};

export const buildInheritedReadabilityCondition = ({
  tableAlias,
  parents,
}: {
  tableAlias: string;
  objectMetadataId?: string;
  principalIds?: string[];
  accessLevels?: string[];
  isOpenWhenDetached?: boolean;
  recordShareTableExpression?: string;
  parents: Array<CompiledColumnParent | CompiledChildrenParent>;
}): SqlCondition => {
  const parts = parents.flatMap((parent) => {
    if (parent.policy.kind === 'denied') {
      return [];
    }

    if (parent.kind === 'column') {
      const policySql =
        parent.policy.kind === 'gated' ? ` AND ${parent.policy.condition.sql}` : '';

      return [
        {
          sql: `"${tableAlias}"."${parent.joinColumnName}" IS NOT NULL AND EXISTS (SELECT 1 FROM ${parent.parentTableExpression} AS "${parent.parentTableAlias}" WHERE "${parent.parentTableAlias}"."id" = "${tableAlias}"."${parent.joinColumnName}"${policySql})`,
          parameters:
            parent.policy.kind === 'gated'
              ? parent.policy.condition.parameters
              : {},
        },
      ];
    }

    const policySql =
      parent.policy.kind === 'gated' ? ` AND ${parent.policy.condition.sql}` : '';

    return [
      {
        sql: `EXISTS (SELECT 1 FROM ${parent.childTableExpression} AS "${parent.childTableAlias}" WHERE "${parent.childTableAlias}"."${parent.childJoinColumnName}" = "${tableAlias}"."id"${policySql})`,
        parameters:
          parent.policy.kind === 'gated' ? parent.policy.condition.parameters : {},
      },
    ];
  });

  if (parts.length === 0) {
    return { sql: '1=0', parameters: {} };
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return {
    sql: parts.map((part) => `(${part.sql})`).join(' OR '),
    parameters: Object.assign({}, ...parts.map((part) => part.parameters)),
  };
};
