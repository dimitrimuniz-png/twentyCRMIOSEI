import { ValidationRuleService } from 'src/engine/metadata-modules/validation-rule/validation-rule.service';

describe('ValidationRuleService', () => {
  it('stores an active rule and refreshes the metadata cache', async () => {
    const validationRuleRepository = {
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
    const service = new ValidationRuleService(
      validationRuleRepository as never,
      workspaceRepository as never,
      workspaceCacheService as never,
    );

    const created = await service.create({
      workspaceId: 'workspace-id',
      input: {
        objectMetadataId: 'object-id',
        name: 'Amount required to win',
        expression: 'stage != "WON" or not isEmpty(amount)',
        message: 'Amount is required',
      },
    });

    expect(created.isActive).toBe(true);
    expect(created.expression).toBe('stage != "WON" or not isEmpty(amount)');
    expect(workspaceCacheService.invalidateAndRecompute).toHaveBeenCalledWith(
      'workspace-id',
      ['flatValidationRuleMaps'],
    );
  });
});
