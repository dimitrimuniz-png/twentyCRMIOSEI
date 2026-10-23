import { getOperandLabel } from '@/object-record/object-filter-dropdown/utils/getOperandLabel';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { mapRLSOperandToRecordFilterOperand } from '@/object-record/record-filter/utils/mapRLSOperandToRecordFilterOperand';
import { settingsDraftRoleFamilyState } from '@/settings/roles/states/settingsDraftRoleFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useSetAtomFamilyState } from '@/ui/utilities/state/jotai/hooks/useSetAtomFamilyState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type RowLevelPermissionPredicateOperand as SharedRowLevelPermissionPredicateOperand } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';
import {
  type RowLevelPermissionPredicate,
  type RowLevelPermissionPredicateGroup,
  RowLevelPermissionPredicateGroupLogicalOperator,
  RowLevelPermissionPredicateOperand,
} from '~/generated-metadata/graphql';

const StyledRuleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRuleRow = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) auto;
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledValueInput = styled.input`
  background: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  height: ${themeCssVariables.spacing[8]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const OPERANDS = Object.values(RowLevelPermissionPredicateOperand);

const getRecordRuleOperandLabel = (
  operand: RowLevelPermissionPredicateOperand,
) => {
  const label = getOperandLabel(
    mapRLSOperandToRecordFilterOperand(
      operand as SharedRowLevelPermissionPredicateOperand,
    ),
  );

  return isNonEmptyString(label) ? label : operand;
};

const OPERANDS_WITHOUT_VALUE = new Set<RowLevelPermissionPredicateOperand>([
  RowLevelPermissionPredicateOperand.IS_EMPTY,
  RowLevelPermissionPredicateOperand.IS_NOT_EMPTY,
  RowLevelPermissionPredicateOperand.IS_NOT_NULL,
  RowLevelPermissionPredicateOperand.IS_IN_FUTURE,
  RowLevelPermissionPredicateOperand.IS_IN_PAST,
  RowLevelPermissionPredicateOperand.IS_TODAY,
]);

type SettingsRolePermissionsObjectLevelRecordLevelSectionProps = {
  roleId: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
};

export const SettingsRolePermissionsObjectLevelRecordLevelSection = ({
  roleId,
  objectMetadataItem,
}: SettingsRolePermissionsObjectLevelRecordLevelSectionProps) => {
  const settingsDraftRole = useAtomFamilyStateValue(
    settingsDraftRoleFamilyState,
    roleId,
  );
  const setSettingsDraftRole = useSetAtomFamilyState(
    settingsDraftRoleFamilyState,
    roleId,
  );

  const predicates = settingsDraftRole.rowLevelPermissionPredicates ?? [];
  const predicateGroups =
    settingsDraftRole.rowLevelPermissionPredicateGroups ?? [];
  const objectPredicates = predicates.filter(
    (predicate) => predicate.objectMetadataId === objectMetadataItem.id,
  );
  const rootGroup = predicateGroups.find(
    (group) =>
      group.objectMetadataId === objectMetadataItem.id &&
      !isDefined(group.parentRowLevelPermissionPredicateGroupId),
  );
  const fields = objectMetadataItem.readableFields.filter(
    (field) => field.isActive,
  );
  const isEditable = settingsDraftRole.isEditable;

  const writeRules = ({
    nextObjectPredicates,
    nextRootGroup,
  }: {
    nextObjectPredicates: RowLevelPermissionPredicate[];
    nextRootGroup?: RowLevelPermissionPredicateGroup;
  }) => {
    const otherPredicates = predicates.filter(
      (predicate) => predicate.objectMetadataId !== objectMetadataItem.id,
    );
    const otherGroups = predicateGroups.filter(
      (group) =>
        group.objectMetadataId !== objectMetadataItem.id ||
        isDefined(group.parentRowLevelPermissionPredicateGroupId),
    );

    setSettingsDraftRole({
      ...settingsDraftRole,
      rowLevelPermissionPredicates: [
        ...otherPredicates,
        ...nextObjectPredicates,
      ],
      rowLevelPermissionPredicateGroups: [
        ...otherGroups,
        ...(isDefined(nextRootGroup) ? [nextRootGroup] : []),
      ],
    });
  };

  const updatePredicate = (
    predicateId: string,
    patch: Partial<RowLevelPermissionPredicate>,
  ) => {
    writeRules({
      nextRootGroup: rootGroup,
      nextObjectPredicates: objectPredicates.map((predicate) =>
        predicate.id === predicateId ? { ...predicate, ...patch } : predicate,
      ),
    });
  };

  const addPredicate = () => {
    const fieldMetadataId = fields[0]?.id;
    if (!isDefined(fieldMetadataId)) {
      return;
    }

    writeRules({
      nextRootGroup: rootGroup,
      nextObjectPredicates: [
        ...objectPredicates,
        {
          __typename: 'RowLevelPermissionPredicate',
          id: crypto.randomUUID(),
          roleId: settingsDraftRole.id,
          objectMetadataId: objectMetadataItem.id,
          fieldMetadataId,
          operand: RowLevelPermissionPredicateOperand.IS_NOT_EMPTY,
          value: null,
          rowLevelPermissionPredicateGroupId: rootGroup?.id,
          positionInRowLevelPermissionPredicateGroup: objectPredicates.length,
        },
      ],
    });
  };

  const setLogicalOperator = (
    logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator,
  ) => {
    const group: RowLevelPermissionPredicateGroup = {
      __typename: 'RowLevelPermissionPredicateGroup',
      id: rootGroup?.id ?? crypto.randomUUID(),
      roleId: settingsDraftRole.id,
      objectMetadataId: objectMetadataItem.id,
      logicalOperator,
      positionInRowLevelPermissionPredicateGroup: 0,
      parentRowLevelPermissionPredicateGroupId: null,
    };

    writeRules({
      nextRootGroup: group,
      nextObjectPredicates: objectPredicates.map((predicate, index) => ({
        ...predicate,
        rowLevelPermissionPredicateGroupId: group.id,
        positionInRowLevelPermissionPredicateGroup: index,
      })),
    });
  };

  return (
    <Section.Root>
      <Section.Header
        title={t`Record rules`}
        description={t`Limit which ${objectMetadataItem.labelPlural} this role can see. Rules combine with the operator below.`}
      />
      <StyledToolbar>
        <StyledSelect
          aria-label={t`How rules combine`}
          disabled={!isEditable}
          value={
            rootGroup?.logicalOperator ??
            RowLevelPermissionPredicateGroupLogicalOperator.AND
          }
          onChange={(event) =>
            setLogicalOperator(
              event.target
                .value as RowLevelPermissionPredicateGroupLogicalOperator,
            )
          }
        >
          <option value={RowLevelPermissionPredicateGroupLogicalOperator.AND}>
            {t`Match all rules`}
          </option>
          <option value={RowLevelPermissionPredicateGroupLogicalOperator.OR}>
            {t`Match any rule`}
          </option>
        </StyledSelect>
        <Button
          size="sm"
          variant="outline"
          disabled={!isEditable || fields.length === 0}
          onClick={addPredicate}
        >{t`Add rule`}</Button>
      </StyledToolbar>
      <StyledRuleList>
        {objectPredicates.map((predicate) => {
          const operandNeedsValue = !OPERANDS_WITHOUT_VALUE.has(
            predicate.operand,
          );

          return (
            <StyledRuleRow key={predicate.id}>
              <StyledSelect
                aria-label={t`Field`}
                disabled={!isEditable}
                value={predicate.fieldMetadataId}
                onChange={(event) =>
                  updatePredicate(predicate.id, {
                    fieldMetadataId: event.target.value,
                  })
                }
              >
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.label}
                  </option>
                ))}
              </StyledSelect>
              <StyledSelect
                aria-label={t`Operator`}
                disabled={!isEditable}
                value={predicate.operand}
                onChange={(event) => {
                  const operand = event.target
                    .value as RowLevelPermissionPredicateOperand;
                  updatePredicate(predicate.id, {
                    operand,
                    value: OPERANDS_WITHOUT_VALUE.has(operand)
                      ? null
                      : predicate.value,
                  });
                }}
              >
                {OPERANDS.map((operand) => (
                  <option key={operand} value={operand}>
                    {getRecordRuleOperandLabel(operand)}
                  </option>
                ))}
              </StyledSelect>
              <StyledValueInput
                aria-label={t`Value`}
                disabled={!isEditable || !operandNeedsValue}
                value={
                  typeof predicate.value === 'string' ? predicate.value : ''
                }
                onChange={(event) =>
                  updatePredicate(predicate.id, { value: event.target.value })
                }
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!isEditable}
                onClick={() =>
                  writeRules({
                    nextRootGroup: rootGroup,
                    nextObjectPredicates: objectPredicates.filter(
                      (candidate) => candidate.id !== predicate.id,
                    ),
                  })
                }
              >{t`Remove`}</Button>
            </StyledRuleRow>
          );
        })}
      </StyledRuleList>
    </Section.Root>
  );
};
