import { renderHook } from '@testing-library/react';

import { useUpsertRowLevelPermissionPredicatesMutation } from '@/settings/roles/graphql/hooks/useUpsertRowLevelPermissionPredicatesMutation';
import { UpsertRowLevelPermissionPredicatesDocument } from '~/generated-metadata/graphql';

const mockUseMutation = jest.fn();

jest.mock('@apollo/client/react', () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

describe('useUpsertRowLevelPermissionPredicatesMutation', () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false }]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls the generated upsertRowLevelPermissionPredicates mutation', () => {
    const { result } = renderHook(() =>
      useUpsertRowLevelPermissionPredicatesMutation(),
    );

    expect(mockUseMutation).toHaveBeenCalledTimes(1);
    expect(mockUseMutation).toHaveBeenCalledWith(
      UpsertRowLevelPermissionPredicatesDocument,
    );
    expect(result.current[0]).toEqual(expect.any(Function));
    expect(
      UpsertRowLevelPermissionPredicatesDocument.definitions[0],
    ).toMatchObject({
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { value: 'UpsertRowLevelPermissionPredicates' },
    });
  });
});
