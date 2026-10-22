import {
  FieldMetadataType,
  RowLevelPermissionPredicateOperand,
} from 'twenty-shared/types';
import { In } from 'typeorm';

import { RowLevelPermissionPredicateService } from 'src/engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate.service';

describe('RowLevelPermissionPredicateService', () => {
  it('replaces the rule set and drops predicates omitted from the input', async () => {
    const existingPredicate = {
      id: 'keep-me',
      universalIdentifier: 'keep-universal',
      applicationId: 'application-id',
    };
    const removedPredicate = { id: 'drop-me' };
    const persistedPredicates: unknown[] = [];
    let hasListedExistingPredicates = false;
    const predicateRepository = {
      find: jest.fn(async () => {
        if (!hasListedExistingPredicates) {
          hasListedExistingPredicates = true;

          return [existingPredicate, removedPredicate];
        }

        return persistedPredicates;
      }),
      softDelete: jest.fn().mockResolvedValue(undefined),
      upsertReturning: jest.fn(
        async (_workspaceId: string, rows: unknown[]) => {
          persistedPredicates.splice(0, persistedPredicates.length, ...rows);

          return rows;
        },
      ),
    };
    const predicateGroupRepository = {
      find: jest.fn().mockResolvedValue([]),
      softDelete: jest.fn(),
      upsertReturning: jest.fn().mockResolvedValue([]),
    };
    const workspaceRepository = {
      findOneByOrFail: jest
        .fn()
        .mockResolvedValue({ workspaceCustomApplicationId: 'application-id' }),
    };
    const workspaceCacheService = {
      invalidateAndRecompute: jest.fn().mockResolvedValue(undefined),
    };
    const fieldMetadataRepository = {
      find: jest.fn().mockResolvedValue([
        { id: 'field-id', type: FieldMetadataType.TEXT, name: 'name' },
        {
          id: 'member-field-id',
          type: FieldMetadataType.TEXT,
          name: 'locale',
        },
      ]),
    };
    const service = new RowLevelPermissionPredicateService(
      predicateRepository as never,
      predicateGroupRepository as never,
      workspaceRepository as never,
      fieldMetadataRepository as never,
      workspaceCacheService as never,
    );

    const result = await service.upsertRowLevelPermissionPredicates({
      workspaceId: 'workspace-id',
      input: {
        roleId: 'role-id',
        objectMetadataId: 'object-id',
        predicateGroups: [],
        predicates: [
          {
            id: 'keep-me',
            fieldMetadataId: 'field-id',
            operand: RowLevelPermissionPredicateOperand.IS,
            workspaceMemberFieldMetadataId: 'member-field-id',
          },
        ],
      },
    });

    expect(predicateRepository.softDelete).toHaveBeenCalledWith(
      'workspace-id',
      { id: In(['drop-me']) },
    );
    expect(result.predicates).toEqual([
      expect.objectContaining({
        id: 'keep-me',
        fieldMetadataId: 'field-id',
        operand: RowLevelPermissionPredicateOperand.IS,
      }),
    ]);
    expect(workspaceCacheService.invalidateAndRecompute).toHaveBeenCalledWith(
      'workspace-id',
      [
        'flatRowLevelPermissionPredicateMaps',
        'flatRowLevelPermissionPredicateGroupMaps',
        'rolesPermissions',
      ],
    );
  });
});
