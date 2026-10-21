import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export const resolveWorkspaceMemberPredicateValue = ({
  workspaceMember,
  workspaceMemberFieldMetadata,
  workspaceMemberSubFieldName,
}: {
  workspaceMember: WorkspaceMemberWorkspaceEntity;
  workspaceMemberFieldMetadata: Pick<
    OrmFlatFieldMetadata,
    'name' | 'type' | 'settings'
  >;
  workspaceMemberSubFieldName: string | null;
}): string | string[] | null => {
  const member = workspaceMember as unknown as Record<string, unknown>;

  if (workspaceMemberFieldMetadata.type === FieldMetadataType.RELATION) {
    const settings = workspaceMemberFieldMetadata.settings;

    if (
      !isDefined(settings) ||
      !('relationType' in settings) ||
      settings.relationType !== RelationType.MANY_TO_ONE
    ) {
      return null;
    }

    const joinColumnValue =
      member[`${workspaceMemberFieldMetadata.name}Id`] ?? null;

    return typeof joinColumnValue === 'string' ? joinColumnValue : null;
  }

  if (isDefined(workspaceMemberSubFieldName)) {
    const composite = member[workspaceMemberFieldMetadata.name];

    if (!isDefined(composite) || typeof composite !== 'object') {
      return null;
    }

    const subFieldValue = (composite as Record<string, unknown>)[
      workspaceMemberSubFieldName
    ];

    return typeof subFieldValue === 'string' ? subFieldValue : null;
  }

  const value = member[workspaceMemberFieldMetadata.name];

  if (!isDefined(value)) {
    return null;
  }

  if (workspaceMemberFieldMetadata.type === FieldMetadataType.SELECT) {
    return typeof value === 'string' ? [value] : null;
  }

  return typeof value === 'string' ? value : null;
};
