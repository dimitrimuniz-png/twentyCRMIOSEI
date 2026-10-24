import { act, renderHook } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

import { GET_ROLES } from '@/settings/roles/graphql/queries/getRolesQuery';
import { useSaveDraftRoleToDB } from '@/settings/roles/role/hooks/useSaveDraftRoleToDB';
import { settingsDraftRoleFamilyState } from '@/settings/roles/states/settingsDraftRoleFamilyState';
import { settingsPersistedRoleFamilyState } from '@/settings/roles/states/settingsPersistedRoleFamilyState';
import { type RoleWithPartialMembers } from '@/settings/roles/types/RoleWithPartialMembers';
import {
  CreateOneRoleDocument,
  type RowLevelPermissionPredicate,
  type RowLevelPermissionPredicateGroup,
  RowLevelPermissionPredicateGroupLogicalOperator,
  RowLevelPermissionPredicateOperand,
  UpsertRowLevelPermissionPredicatesDocument,
} from '~/generated-metadata/graphql';
import { getOperationName } from '~/utils/getOperationName';

const mockUseMutation = jest.fn();
const mockCreateRole = jest.fn();
const mockUpsertRowLevelPermissionPredicates = jest.fn();
const mockOtherMutation = jest.fn();

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

const ROLE_ID = 'role-id';
const CREATED_ROLE_ID = 'created-role-id';
const OBJECT_METADATA_ID = 'opportunity-object-id';
const OTHER_OBJECT_METADATA_ID = 'company-object-id';
const FIELD_METADATA_ID = 'stage-field-id';
const OTHER_FIELD_METADATA_ID = 'amount-field-id';
const GROUP_ID = 'group-id';
const PARENT_GROUP_ID = 'parent-group-id';
const PREDICATE_ID = 'predicate-id';
const OTHER_PREDICATE_ID = 'other-predicate-id';

const buildPredicate = (
  overrides: Partial<RowLevelPermissionPredicate> = {},
): RowLevelPermissionPredicate => ({
  __typename: 'RowLevelPermissionPredicate',
  id: PREDICATE_ID,
  roleId: ROLE_ID,
  objectMetadataId: OBJECT_METADATA_ID,
  fieldMetadataId: FIELD_METADATA_ID,
  operand: RowLevelPermissionPredicateOperand.IS,
  value: 'open',
  subFieldName: null,
  workspaceMemberFieldMetadataId: null,
  workspaceMemberSubFieldName: null,
  rowLevelPermissionPredicateGroupId: GROUP_ID,
  positionInRowLevelPermissionPredicateGroup: 0,
  ...overrides,
});

const buildPredicateGroup = (
  overrides: Partial<RowLevelPermissionPredicateGroup> = {},
): RowLevelPermissionPredicateGroup => ({
  __typename: 'RowLevelPermissionPredicateGroup',
  id: GROUP_ID,
  roleId: ROLE_ID,
  objectMetadataId: OBJECT_METADATA_ID,
  logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator.AND,
  parentRowLevelPermissionPredicateGroupId: null,
  positionInRowLevelPermissionPredicateGroup: 0,
  ...overrides,
});

const ROLE_BASIC_FIELDS_INPUT = {
  description: '',
  icon: 'IconUser',
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: true,
  canBeAssignedToApiKeys: true,
};

const PERSISTED_ROLE: RoleWithPartialMembers = {
  __typename: 'Role',
  id: ROLE_ID,
  label: 'Sales',
  description: '',
  icon: 'IconUser',
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: true,
  canBeAssignedToApiKeys: true,
  applicationId: 'application-id',
  isEditable: true,
  workspaceMembers: [],
  agents: [],
  apiKeys: [],
  permissionFlags: [],
  objectPermissions: [],
  fieldPermissions: [],
  rowLevelPermissionPredicates: [],
  rowLevelPermissionPredicateGroups: [],
};

const renderUseSaveDraftRoleToDB = ({
  isCreateMode,
  draftRole,
  persistedRole,
  onSuccess,
}: {
  isCreateMode: boolean;
  draftRole: RoleWithPartialMembers;
  persistedRole: RoleWithPartialMembers | undefined;
  onSuccess: (savedRoleId: string) => void;
}) => {
  const store = createStore();

  store.set(settingsDraftRoleFamilyState.atomFamily(ROLE_ID), draftRole);
  store.set(
    settingsPersistedRoleFamilyState.atomFamily(ROLE_ID),
    persistedRole,
  );

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <JotaiProvider store={store}>{children}</JotaiProvider>
  );

  return renderHook(
    () => useSaveDraftRoleToDB({ roleId: ROLE_ID, isCreateMode, onSuccess }),
    { wrapper: Wrapper },
  );
};

describe('useSaveDraftRoleToDB', () => {
  beforeEach(() => {
    mockCreateRole.mockResolvedValue({
      data: { createOneRole: { id: ROLE_ID } },
    });
    mockUpsertRowLevelPermissionPredicates.mockResolvedValue({ data: {} });
    mockOtherMutation.mockResolvedValue({ data: {} });
    mockUseMutation.mockImplementation((document: unknown) => {
      if (document === CreateOneRoleDocument) {
        return [mockCreateRole];
      }

      if (document === UpsertRowLevelPermissionPredicatesDocument) {
        return [mockUpsertRowLevelPermissionPredicates];
      }

      return [mockOtherMutation];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call onSuccess once with the created role id when creating a role', async () => {
    const onSuccess = jest.fn();

    const { result } = renderUseSaveDraftRoleToDB({
      isCreateMode: true,
      draftRole: { ...PERSISTED_ROLE, label: 'New role' },
      persistedRole: undefined,
      onSuccess,
    });

    await act(async () => {
      await result.current.saveDraftRoleToDB();
    });

    expect(mockCreateRole).toHaveBeenCalledTimes(1);
    expect(mockCreateRole).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          createRoleInput: {
            id: ROLE_ID,
            label: 'New role',
            ...ROLE_BASIC_FIELDS_INPUT,
          },
        },
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(ROLE_ID);
  });

  it('rejects and skips onSuccess when role creation returns no data', async () => {
    const onSuccess = jest.fn();

    mockCreateRole.mockResolvedValue({ data: undefined });

    const { result } = renderUseSaveDraftRoleToDB({
      isCreateMode: true,
      draftRole: { ...PERSISTED_ROLE, label: 'New role' },
      persistedRole: undefined,
      onSuccess,
    });

    await act(async () => {
      await expect(result.current.saveDraftRoleToDB()).rejects.toThrow(
        'An error occurred.',
      );
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('rejects and skips later writes when a permission mutation returns an error', async () => {
    const onSuccess = jest.fn();
    const permissionError = new Error('The role could not be found.');

    mockUpsertRowLevelPermissionPredicates.mockResolvedValue({
      data: undefined,
      error: permissionError,
    });

    const { result } = renderUseSaveDraftRoleToDB({
      isCreateMode: true,
      draftRole: {
        ...PERSISTED_ROLE,
        label: 'New role',
        objectPermissions: [
          {
            objectMetadataId: OBJECT_METADATA_ID,
            canReadObjectRecords: true,
            canUpdateObjectRecords: false,
            canSoftDeleteObjectRecords: false,
            canDestroyObjectRecords: false,
          },
        ],
        rowLevelPermissionPredicates: [buildPredicate()],
        rowLevelPermissionPredicateGroups: [buildPredicateGroup()],
      },
      persistedRole: undefined,
      onSuccess,
    });

    await act(async () => {
      await expect(result.current.saveDraftRoleToDB()).rejects.toBe(
        permissionError,
      );
    });

    expect(mockCreateRole).toHaveBeenCalledTimes(1);
    expect(mockOtherMutation).toHaveBeenCalled();
    expect(mockUpsertRowLevelPermissionPredicates).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should call onSuccess once with the role id when updating a role', async () => {
    const onSuccess = jest.fn();

    const { result } = renderUseSaveDraftRoleToDB({
      isCreateMode: false,
      draftRole: { ...PERSISTED_ROLE, label: 'Sales team' },
      persistedRole: PERSISTED_ROLE,
      onSuccess,
    });

    await act(async () => {
      await result.current.saveDraftRoleToDB();
    });

    expect(mockCreateRole).not.toHaveBeenCalled();
    expect(mockOtherMutation).toHaveBeenCalledTimes(1);
    expect(mockOtherMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          updateRoleInput: {
            id: ROLE_ID,
            update: { label: 'Sales team', ...ROLE_BASIC_FIELDS_INPUT },
          },
        },
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(ROLE_ID);
  });

  it('saves record rules after creating a role, using the created role id', async () => {
    const onSuccess = jest.fn();
    const predicate = buildPredicate();
    const predicateGroup = buildPredicateGroup({
      logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator.OR,
    });

    mockCreateRole.mockResolvedValue({
      data: { createOneRole: { id: CREATED_ROLE_ID } },
    });

    const { result } = renderUseSaveDraftRoleToDB({
      isCreateMode: true,
      draftRole: {
        ...PERSISTED_ROLE,
        label: 'New role',
        rowLevelPermissionPredicates: [predicate],
        rowLevelPermissionPredicateGroups: [predicateGroup],
      },
      persistedRole: undefined,
      onSuccess,
    });

    await act(async () => {
      await result.current.saveDraftRoleToDB();
    });

    expect(mockCreateRole).toHaveBeenCalledTimes(1);
    expect(mockUpsertRowLevelPermissionPredicates).toHaveBeenCalledTimes(1);
    expect(mockCreateRole.mock.invocationCallOrder[0]).toBeLessThan(
      mockUpsertRowLevelPermissionPredicates.mock.invocationCallOrder[0],
    );
    expect(mockUpsertRowLevelPermissionPredicates).toHaveBeenCalledWith({
      variables: {
        input: {
          roleId: CREATED_ROLE_ID,
          objectMetadataId: OBJECT_METADATA_ID,
          predicates: [
            {
              id: PREDICATE_ID,
              fieldMetadataId: FIELD_METADATA_ID,
              operand: RowLevelPermissionPredicateOperand.IS,
              value: 'open',
              subFieldName: null,
              workspaceMemberFieldMetadataId: null,
              workspaceMemberSubFieldName: null,
              rowLevelPermissionPredicateGroupId: GROUP_ID,
              positionInRowLevelPermissionPredicateGroup: 0,
            },
          ],
          predicateGroups: [
            {
              id: GROUP_ID,
              objectMetadataId: OBJECT_METADATA_ID,
              parentRowLevelPermissionPredicateGroupId: null,
              logicalOperator:
                RowLevelPermissionPredicateGroupLogicalOperator.OR,
              positionInRowLevelPermissionPredicateGroup: 0,
            },
          ],
        },
      },
      refetchQueries: [getOperationName(GET_ROLES)],
      awaitRefetchQueries: true,
    });
    expect(onSuccess).toHaveBeenCalledWith(CREATED_ROLE_ID);
  });

  it('saves every predicate and includes parent groups when updating a role', async () => {
    const onSuccess = jest.fn();
    const parentGroup = buildPredicateGroup({
      id: PARENT_GROUP_ID,
      logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator.OR,
    });
    const childGroup = buildPredicateGroup({
      id: GROUP_ID,
      parentRowLevelPermissionPredicateGroupId: PARENT_GROUP_ID,
      positionInRowLevelPermissionPredicateGroup: 1,
    });
    const predicates = [
      buildPredicate({ value: 'won' }),
      buildPredicate({
        id: OTHER_PREDICATE_ID,
        fieldMetadataId: OTHER_FIELD_METADATA_ID,
        operand: RowLevelPermissionPredicateOperand.IS_NOT,
        value: 'lost',
        positionInRowLevelPermissionPredicateGroup: 1,
      }),
    ];

    const { result } = renderUseSaveDraftRoleToDB({
      isCreateMode: false,
      draftRole: {
        ...PERSISTED_ROLE,
        rowLevelPermissionPredicates: predicates,
        rowLevelPermissionPredicateGroups: [parentGroup, childGroup],
      },
      persistedRole: PERSISTED_ROLE,
      onSuccess,
    });

    await act(async () => {
      await result.current.saveDraftRoleToDB();
    });

    expect(mockCreateRole).not.toHaveBeenCalled();
    expect(mockOtherMutation).not.toHaveBeenCalled();
    expect(mockUpsertRowLevelPermissionPredicates).toHaveBeenCalledTimes(1);
    expect(mockUpsertRowLevelPermissionPredicates).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            roleId: ROLE_ID,
            objectMetadataId: OBJECT_METADATA_ID,
            predicates: [
              expect.objectContaining({
                id: PREDICATE_ID,
                operand: RowLevelPermissionPredicateOperand.IS,
                value: 'won',
              }),
              expect.objectContaining({
                id: OTHER_PREDICATE_ID,
                fieldMetadataId: OTHER_FIELD_METADATA_ID,
                operand: RowLevelPermissionPredicateOperand.IS_NOT,
                value: 'lost',
                positionInRowLevelPermissionPredicateGroup: 1,
              }),
            ],
            predicateGroups: expect.arrayContaining([
              expect.objectContaining({
                id: PARENT_GROUP_ID,
                logicalOperator:
                  RowLevelPermissionPredicateGroupLogicalOperator.OR,
              }),
              expect.objectContaining({
                id: GROUP_ID,
                parentRowLevelPermissionPredicateGroupId: PARENT_GROUP_ID,
              }),
            ]),
          }),
        },
        refetchQueries: [getOperationName(GET_ROLES)],
        awaitRefetchQueries: true,
      }),
    );
    expect(onSuccess).toHaveBeenCalledWith(ROLE_ID);
  });

  it('clears record rules for an object whose predicates were removed', async () => {
    const onSuccess = jest.fn();
    const keptPredicate = buildPredicate({ value: 'open' });
    const removedPredicate = buildPredicate({
      id: OTHER_PREDICATE_ID,
      objectMetadataId: OTHER_OBJECT_METADATA_ID,
      rowLevelPermissionPredicateGroupId: null,
    });
    const keptGroup = buildPredicateGroup();

    const { result } = renderUseSaveDraftRoleToDB({
      isCreateMode: false,
      draftRole: {
        ...PERSISTED_ROLE,
        rowLevelPermissionPredicates: [keptPredicate],
        rowLevelPermissionPredicateGroups: [keptGroup],
      },
      persistedRole: {
        ...PERSISTED_ROLE,
        rowLevelPermissionPredicates: [removedPredicate, keptPredicate],
        rowLevelPermissionPredicateGroups: [keptGroup],
      },
      onSuccess,
    });

    await act(async () => {
      await result.current.saveDraftRoleToDB();
    });

    expect(mockUpsertRowLevelPermissionPredicates).toHaveBeenCalledTimes(2);
    expect(mockUpsertRowLevelPermissionPredicates).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            roleId: ROLE_ID,
            objectMetadataId: OBJECT_METADATA_ID,
            predicates: [expect.objectContaining({ id: PREDICATE_ID })],
          }),
        },
      }),
    );
    expect(mockUpsertRowLevelPermissionPredicates).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            roleId: ROLE_ID,
            objectMetadataId: OTHER_OBJECT_METADATA_ID,
            predicates: [],
            predicateGroups: [],
          },
        },
      }),
    );
  });
});
