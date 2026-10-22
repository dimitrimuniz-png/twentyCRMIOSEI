import { EventLogTable } from 'twenty-shared/types';

import { EventLogsService } from 'src/engine/core-modules/event-logs/event-logs.service';

describe('EventLogsService', () => {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };
  const auditLogRepository = {
    createScopedQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    delete: jest.fn().mockResolvedValue({ affected: 2 }),
  };
  const workspaceRepository = {
    find: jest.fn(),
  };
  const service = new EventLogsService(
    auditLogRepository as never,
    workspaceRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogRepository.createScopedQueryBuilder.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnThis();
    queryBuilder.andWhere.mockReturnThis();
    queryBuilder.orderBy.mockReturnThis();
    queryBuilder.addOrderBy.mockReturnThis();
  });

  it('does not gate queries on a commercial entitlement', async () => {
    await expect(
      service.validateAccess('workspace-id', EventLogTable.OBJECT_EVENT),
    ).resolves.toBeUndefined();
  });

  it('paginates matching rows and returns a cursor', async () => {
    queryBuilder.getMany.mockResolvedValue([
      {
        event: 'created',
        occurredAt: new Date('2026-01-02T00:00:00.000Z'),
        userId: 'user-1',
        properties: {},
        recordId: null,
        objectMetadataId: null,
        payload: { event: 'created' },
      },
      {
        event: 'updated',
        occurredAt: new Date('2026-01-01T00:00:00.000Z'),
        userId: null,
        properties: { name: 'kept' },
        recordId: null,
        objectMetadataId: null,
        payload: { event: 'other' },
      },
    ]);

    const page = await service.query({
      workspaceId: 'workspace-id',
      input: {
        table: EventLogTable.WORKSPACE_EVENT,
        first: 1,
        filters: {
          fieldFilters: [
            { field: 'event', operator: 'IS', values: ['created'] },
          ],
        },
      } as never,
    });

    expect(page.totalCount).toBe(1);
    expect(page.records).toHaveLength(1);
    expect(page.records[0]?.event).toBe('created');
    expect(page.pageInfo.hasNextPage).toBe(false);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'auditLog.tableName = :tableName',
      { tableName: 'workspaceEvent' },
    );
  });

  it('deletes rows older than the workspace retention', async () => {
    workspaceRepository.find.mockResolvedValue([
      { id: 'workspace-id', eventLogRetentionDays: 3 },
    ]);

    await expect(service.deleteExpired()).resolves.toBe(2);
    expect(auditLogRepository.delete).toHaveBeenCalledWith(
      'workspace-id',
      expect.objectContaining({
        occurredAt: expect.anything(),
      }),
    );
    expect(auditLogRepository.delete.mock.calls[0]?.[1]).not.toHaveProperty(
      'workspaceId',
    );
  });
});
