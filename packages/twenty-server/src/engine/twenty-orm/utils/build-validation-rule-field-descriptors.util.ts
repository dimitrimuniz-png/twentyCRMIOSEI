import { type FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type FieldMaps = {
  universalIdentifierById: Partial<Record<string, string>>;
  byUniversalIdentifier: Partial<
    Record<
      string,
      {
        name: string;
        type: FieldMetadataType;
        universalIdentifier: string;
      }
    >
  >;
};

export const buildValidationRuleFieldDescriptors = ({
  fieldIds,
  flatFieldMetadataMaps,
}: {
  fieldIds: string[];
  flatFieldMetadataMaps: FieldMaps;
}) =>
  fieldIds.flatMap((fieldId) => {
    const universalIdentifier =
      flatFieldMetadataMaps.universalIdentifierById[fieldId];

    if (!isDefined(universalIdentifier)) {
      return [];
    }

    const field =
      flatFieldMetadataMaps.byUniversalIdentifier[universalIdentifier];

    if (!isDefined(field)) {
      return [];
    }

    return [
      {
        name: field.name,
        type: field.type,
        universalIdentifier: field.universalIdentifier,
      },
    ];
  });
