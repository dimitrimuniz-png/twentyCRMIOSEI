import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AccessibleFlatFieldMetadataMaps } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

type RelationSettings = {
  relationType?: RelationType | string;
  joinColumnName?: string;
};

type InheritedReadabilityParent =
  | {
      kind: 'column';
      fieldMetadataId: string;
      joinColumnName: string;
      parentFlatObjectMetadata: FlatObjectMetadata;
    }
  | {
      kind: 'children';
      fieldMetadataId: string;
      childJoinColumnName: string;
      childFlatObjectMetadata: FlatObjectMetadata;
    };

export const resolveInheritedReadabilityParents = ({
  flatObjectMetadata,
  flatFieldMetadataMaps: flatFieldMetadataMapsInput,
  flatObjectMetadataMaps,
}: {
  flatObjectMetadata: FlatObjectMetadata;
  flatFieldMetadataMaps: AccessibleFlatFieldMetadataMaps;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
}): InheritedReadabilityParent[] => {
  const flatFieldMetadataMaps =
    flatFieldMetadataMapsInput as FlatEntityMaps<FlatFieldMetadata>;
  const objectFields = listFields(flatObjectMetadata, flatFieldMetadataMaps);
  const parents: InheritedReadabilityParent[] = [];
  const seenJoinColumns = new Set<string>();

  for (const universalIdentifier of flatObjectMetadata.readabilityParentFieldUniversalIdentifiers ??
    []) {
    const field =
      flatFieldMetadataMaps.byUniversalIdentifier[universalIdentifier];

    if (!isDefined(field)) {
      continue;
    }

    if (isDefined(field.morphId)) {
      for (const sibling of objectFields) {
        if (sibling.morphId !== field.morphId) {
          continue;
        }

        const columnParent = toColumnParent({
          field: sibling,
          flatObjectMetadataMaps,
        });

        if (
          !isDefined(columnParent) ||
          seenJoinColumns.has(columnParent.joinColumnName)
        ) {
          continue;
        }

        seenJoinColumns.add(columnParent.joinColumnName);
        parents.push(columnParent);
      }

      continue;
    }

    const settings = relationSettings(field);

    if (settings?.relationType === RelationType.ONE_TO_MANY) {
      const childrenParent = toChildrenParent({
        field,
        flatFieldMetadataMaps,
        flatObjectMetadataMaps,
      });

      if (isDefined(childrenParent)) {
        parents.push(childrenParent);
      }

      continue;
    }

    const columnParent = toColumnParent({ field, flatObjectMetadataMaps });

    if (
      isDefined(columnParent) &&
      !seenJoinColumns.has(columnParent.joinColumnName)
    ) {
      seenJoinColumns.add(columnParent.joinColumnName);
      parents.push(columnParent);
    }
  }

  return parents;
};

const toColumnParent = ({
  field,
  flatObjectMetadataMaps,
}: {
  field: FlatFieldMetadata;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
}): Extract<InheritedReadabilityParent, { kind: 'column' }> | undefined => {
  const settings = relationSettings(field);

  if (
    field.type !== FieldMetadataType.MORPH_RELATION &&
    field.type !== FieldMetadataType.RELATION
  ) {
    return undefined;
  }

  if (settings?.relationType === RelationType.ONE_TO_MANY) {
    return undefined;
  }

  if (!isDefined(field.relationTargetObjectMetadataId)) {
    return undefined;
  }

  const parentFlatObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
    flatEntityId: field.relationTargetObjectMetadataId,
    flatEntityMaps: flatObjectMetadataMaps,
  });

  if (!isDefined(parentFlatObjectMetadata)) {
    return undefined;
  }

  return {
    kind: 'column',
    fieldMetadataId: field.id,
    joinColumnName: settings?.joinColumnName ?? `${field.name}Id`,
    parentFlatObjectMetadata,
  };
};

const toChildrenParent = ({
  field,
  flatFieldMetadataMaps,
  flatObjectMetadataMaps,
}: {
  field: FlatFieldMetadata;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
}): Extract<InheritedReadabilityParent, { kind: 'children' }> | undefined => {
  if (!isDefined(field.relationTargetObjectMetadataId)) {
    return undefined;
  }

  const childFlatObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
    flatEntityId: field.relationTargetObjectMetadataId,
    flatEntityMaps: flatObjectMetadataMaps,
  });
  const inverseField = isDefined(field.relationTargetFieldMetadataId)
    ? findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: field.relationTargetFieldMetadataId,
        flatEntityMaps: flatFieldMetadataMaps,
      })
    : undefined;

  if (!isDefined(childFlatObjectMetadata) || !isDefined(inverseField)) {
    return undefined;
  }

  const inverseSettings = relationSettings(inverseField);

  return {
    kind: 'children',
    fieldMetadataId: field.id,
    childJoinColumnName:
      inverseSettings?.joinColumnName ?? `${inverseField.name}Id`,
    childFlatObjectMetadata,
  };
};

const listFields = (
  flatObjectMetadata: FlatObjectMetadata,
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
): FlatFieldMetadata[] => {
  const fromIds = flatObjectMetadata.fieldIds.flatMap((fieldId) => {
    const field = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: fieldId,
      flatEntityMaps: flatFieldMetadataMaps,
    });

    return isDefined(field) ? [field] : [];
  });

  if (fromIds.length > 0) {
    return fromIds;
  }

  // Standard-object maps are assembled before field ids are written back onto
  // the object, so siblings are found by the object they belong to.
  return Object.values(flatFieldMetadataMaps.byUniversalIdentifier).filter(
    (field): field is FlatFieldMetadata =>
      isDefined(field) && field.objectMetadataId === flatObjectMetadata.id,
  );
};

const relationSettings = (
  field: FlatFieldMetadata,
): RelationSettings | undefined =>
  isDefined(field.settings) ? (field.settings as RelationSettings) : undefined;
