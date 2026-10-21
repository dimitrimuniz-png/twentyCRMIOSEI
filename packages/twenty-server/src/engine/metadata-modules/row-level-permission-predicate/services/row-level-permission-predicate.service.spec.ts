import { RowLevelPermissionPredicateOperand } from 'twenty-shared/types';

import { RowLevelPermissionPredicateService } from 'src/engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate.service';

describe('RowLevelPermissionPredicateService', () => {
  it('replaces the rule set and drops predicates omitted from the input', async () => {
    const existingPredicate = {
      id: 'keep-me',
      universalIdentifier: 'keep-universal',
      applicationId: 'application-id',
    };
    const removedPredicate = { id: 'drop-me' };
    const predicateRepository = {
      find: jest
        .fn()
        .mockResolvedValue([existingPredicate, removedPredicate]),
      softRemove: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const predicateGroupRepository = {
      find: jest.fn().mockResolvedValue([]),
      softRemove: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const workspaceRepository = {
      findOneByOrFail: jest
        .fn()
        .mockResolvedValue({ workspaceCustomApplicationId: 'application-id' }),
    };
    const workspaceCacheService = {
      invalidateAndRecompute: jest.fn().mockResolvedValue(undefined),
    };
    const service = new RowLevelPermissionPredicateService(
      predicateRepository as never,
      predicateGroupRepository as never,
      workspaceRepository as never,
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

    expect(predicateRepository.softRemove).toHaveBeenCalledWith([
      removedPredicate,
    ]);
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
