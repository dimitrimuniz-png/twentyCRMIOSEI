import { Injectable } from '@nestjs/common';
import { type EntityManager, FindOperator } from 'typeorm';
import {
  RecordShareRowCause,
  type RecordShareAccessLevel,
  type RecordSharePrincipalType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type RecordShareInput } from 'src/engine/core-modules/record-share/types/record-share-input.type';
import { type RecordShare } from 'src/engine/core-modules/record-share/types/record-share.type';
import { type WorkspaceTransactionScope } from 'src/engine/twenty-orm/types/workspace-transaction-scope.type';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { escapeIdentifier } from 'src/engine/workspace-manager/workspace-migration/utils/remove-sql-injection.util';

const RECORD_SHARE_COLUMNS = [
  'objectMetadataId',
  'recordId',
  'principalId',
  'principalType',
  'accessLevel',
  'rowCause',
  'sourceId',
] as const;

const UUID_COLUMNS = new Set([
  'objectMetadataId',
  'recordId',
  'principalId',
  'sourceId',
]);

// Bound parameters arrive as text, and these enums have no text equality operator.
const ENUM_COLUMNS = new Set(['principalType', 'accessLevel', 'rowCause']);

const UNIQUE_COLUMNS = [
  'objectMetadataId',
  'recordId',
  'principalId',
  'rowCause',
  'sourceId',
] as const;

export type RecordShareCriteria = {
  objectMetadataId?: string | FindOperator<string>;
  recordId?: string | FindOperator<string>;
  principalId?: string | FindOperator<string>;
  principalType?: RecordSharePrincipalType | FindOperator<string>;
  accessLevel?: RecordShareAccessLevel | FindOperator<string>;
  rowCause?: RecordShareRowCause | FindOperator<string>;
  sourceId?: string | FindOperator<string>;
};

type ManualShare = {
  principalId: string;
  principalType: RecordSharePrincipalType;
  accessLevel: RecordShareAccessLevel;
  objectMetadataId: string;
  recordId: string;
  sourceId: string;
};

const quoted = (identifier: string): string => escapeIdentifier(identifier);

const recordShareTable = (workspaceId: string): string =>
  `${quoted(getWorkspaceSchemaName(workspaceId))}.${quoted('recordShare')}`;

const readOperatorValues = (value: FindOperator<string>): unknown[] => {
  const raw = value.child ?? value.value;
  return Array.isArray(raw) ? raw : [raw];
};

const appendPredicate = ({
  column,
  value,
  clauses,
  parameters,
}: {
  column: (typeof RECORD_SHARE_COLUMNS)[number] | 'objectMetadataId';
  value: unknown;
  clauses: string[];
  parameters: unknown[];
}): void => {
  if (!isDefined(value)) {
    return;
  }

  const quotedColumn = quoted(column);

  if (value instanceof FindOperator) {
    const values = readOperatorValues(value);
    if (values.length === 0) {
      clauses.push('FALSE');
      return;
    }
    parameters.push(values);
    const cast = UUID_COLUMNS.has(column) ? '::uuid[]' : '::text[]';
    const comparedColumn = ENUM_COLUMNS.has(column)
      ? `${quotedColumn}::text`
      : quotedColumn;
    clauses.push(`${comparedColumn} = ANY($${parameters.length}${cast})`);
    return;
  }

  parameters.push(value);
  const comparedColumn = ENUM_COLUMNS.has(column)
    ? `${quotedColumn}::text`
    : quotedColumn;
  clauses.push(`${comparedColumn} = $${parameters.length}`);
};

const toRecordShare = (row: Record<string, unknown>): RecordShare => ({
  id: String(row.id),
  recordId: String(row.recordId),
  objectMetadataId: String(row.objectMetadataId),
  principalId: String(row.principalId),
  principalType: row.principalType as RecordShare['principalType'],
  accessLevel: row.accessLevel as RecordShare['accessLevel'],
  rowCause: row.rowCause as RecordShare['rowCause'],
  sourceId: String(row.sourceId),
});

@Injectable()
export class RecordShareStorageService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async insertMany({
    workspaceId,
    recordShares,
    transactionScope,
  }: {
    workspaceId: string;
    recordShares: RecordShareInput[];
    transactionScope?: WorkspaceTransactionScope;
  }): Promise<void> {
    const deduped = [
      ...recordShares
        .reduce((sharesByKey, share) => {
          sharesByKey.set(
            UNIQUE_COLUMNS.map((column) => share[column]).join(':'),
            share,
          );
          return sharesByKey;
        }, new Map<string, RecordShareInput>())
        .values(),
    ];

    for (let offset = 0; offset < deduped.length; offset += 200) {
      await this.upsert(
        workspaceId,
        deduped.slice(offset, offset + 200),
        transactionScope,
      );
    }
  }

  async setManualShare({
    workspaceId,
    transactionScope,
    enabled,
    share,
  }: {
    workspaceId: string;
    transactionScope: WorkspaceTransactionScope;
    enabled: boolean;
    share: ManualShare;
  }): Promise<void> {
    if (!enabled) {
      await this.query(
        workspaceId,
        transactionScope,
        `DELETE FROM ${recordShareTable(workspaceId)}
         WHERE ${quoted('objectMetadataId')} = $1
           AND ${quoted('recordId')} = $2
           AND ${quoted('principalId')} = $3
           AND ${quoted('sourceId')} = $4
           AND ${quoted('rowCause')}::text = $5`,
        [
          share.objectMetadataId,
          share.recordId,
          share.principalId,
          share.sourceId,
          RecordShareRowCause.MANUAL,
        ],
      );
      return;
    }

    await this.upsert(
      workspaceId,
      [
        {
          ...share,
          rowCause: RecordShareRowCause.MANUAL,
        },
      ],
      transactionScope,
    );
  }

  async findByRecordIds({
    workspaceId,
    objectMetadataId,
    recordIds,
    transactionScope,
  }: {
    workspaceId: string;
    objectMetadataId: string;
    recordIds: string[];
    transactionScope?: WorkspaceTransactionScope;
  }): Promise<RecordShare[]> {
    if (recordIds.length === 0) {
      return [];
    }

    const rows = await this.query(
      workspaceId,
      transactionScope,
      `SELECT ${quoted('id')}, ${quoted('recordId')}, ${quoted('objectMetadataId')},
              ${quoted('principalId')}, ${quoted('principalType')}, ${quoted('accessLevel')},
              ${quoted('rowCause')}, ${quoted('sourceId')}
       FROM ${recordShareTable(workspaceId)}
       WHERE ${quoted('objectMetadataId')} = $1
         AND ${quoted('recordId')} = ANY($2::uuid[])
         AND ${quoted('deletedAt')} IS NULL
       ORDER BY ${quoted('id')}`,
      [objectMetadataId, recordIds],
    );

    return rows.map(toRecordShare);
  }

  async deleteByRecordIds({
    workspaceId,
    objectMetadataId,
    recordIds,
    transactionScope,
  }: {
    workspaceId: string;
    objectMetadataId: string;
    recordIds: string[];
    transactionScope?: WorkspaceTransactionScope;
  }): Promise<void> {
    if (recordIds.length === 0) {
      return;
    }

    await this.query(
      workspaceId,
      transactionScope,
      `DELETE FROM ${recordShareTable(workspaceId)}
       WHERE ${quoted('objectMetadataId')} = $1
         AND ${quoted('recordId')} = ANY($2::uuid[])`,
      [objectMetadataId, recordIds],
    );
  }

  async deleteByRecordIdsInTransaction({
    workspaceId,
    objectMetadataId,
    recordIds,
    manager,
  }: {
    workspaceId: string;
    objectMetadataId: string;
    recordIds: string[];
    manager: EntityManager;
  }): Promise<void> {
    if (recordIds.length === 0) {
      return;
    }

    await manager.query(
      `DELETE FROM ${recordShareTable(workspaceId)}
       WHERE ${quoted('objectMetadataId')} = $1
         AND ${quoted('recordId')} = ANY($2::uuid[])`,
      [objectMetadataId, recordIds],
    );
  }

  async deleteMatching({
    workspaceId,
    transactionScope,
    criteria,
  }: {
    workspaceId: string;
    transactionScope: WorkspaceTransactionScope;
    criteria: RecordShareCriteria[];
  }): Promise<void> {
    const parameters: unknown[] = [];
    const groups = criteria
      .map((criterion) => {
        const clauses: string[] = [];
        for (const column of RECORD_SHARE_COLUMNS) {
          appendPredicate({
            column,
            value: criterion[column],
            clauses,
            parameters,
          });
        }
        return clauses;
      })
      .filter((clauses) => clauses.length > 0);

    if (groups.length === 0) {
      return;
    }

    await this.query(
      workspaceId,
      transactionScope,
      `DELETE FROM ${recordShareTable(workspaceId)}
       WHERE ${groups.map((clauses) => `(${clauses.join(' AND ')})`).join(' OR ')}`,
      parameters,
    );
  }

  private async upsert(
    workspaceId: string,
    recordShares: RecordShareInput[],
    transactionScope?: WorkspaceTransactionScope,
  ): Promise<void> {
    if (recordShares.length === 0) {
      return;
    }

    const parameters: unknown[] = [];
    const tuples = recordShares.map((share) => {
      const placeholders = RECORD_SHARE_COLUMNS.map((column) => {
        parameters.push(share[column]);
        return `$${parameters.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    const columnList = RECORD_SHARE_COLUMNS.map(quoted).join(', ');
    const conflictTarget = UNIQUE_COLUMNS.map(quoted).join(', ');

    await this.query(
      workspaceId,
      transactionScope,
      `INSERT INTO ${recordShareTable(workspaceId)} (${columnList})
       VALUES ${tuples.join(', ')}
       ON CONFLICT (${conflictTarget})
       DO UPDATE SET
         ${quoted('principalType')} = EXCLUDED.${quoted('principalType')},
         ${quoted('accessLevel')} = EXCLUDED.${quoted('accessLevel')},
         ${quoted('updatedAt')} = now()`,
      parameters,
    );
  }

  private query(
    workspaceId: string,
    transactionScope: WorkspaceTransactionScope | undefined,
    sql: string,
    parameters: unknown[],
  ): Promise<Record<string, unknown>[]> {
    if (isDefined(transactionScope)) {
      return transactionScope.executeRawQuery(sql, parameters);
    }

    return this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager.runInWorkspaceTransaction((scope) =>
          scope.executeRawQuery(sql, parameters),
        ),
      buildSystemAuthContext(workspaceId),
    );
  }
}
