import {
  MetadataReadability,
  RecordShareAccessLevel,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { resolveInheritedReadabilityParents } from 'src/engine/core-modules/record-share/utils/resolve-inherited-readability-parents.util';
import { buildPostgresSafeAlias } from 'src/engine/twenty-orm/sql/utils/build-postgres-safe-alias.util';
import { resolveObjectSharing } from 'src/engine/core-modules/record-share/utils/resolve-object-sharing.util';
import { RecordSharingMode } from 'src/engine/core-modules/record-share/enums/record-sharing-mode.enum';
import { isMetadataWritePermitted } from 'src/engine/twenty-orm/utils/is-metadata-write-permitted.util';
import { isObjectOperationPermitted } from 'src/engine/twenty-orm/utils/is-object-operation-permitted.util';
import {
  type InheritedReadabilityParentExpression,
  type RecordShareExpressionTarget,
  type RowAccessPolicy,
  type RowAccessPolicyContext,
  type RowAccessPolicyTarget,
} from 'src/engine/twenty-orm/types/row-access-policy.type';

const READ_ACCESS_LEVELS = [
  RecordShareAccessLevel.READ,
  RecordShareAccessLevel.READ_WRITE,
  RecordShareAccessLevel.FULL,
];

const WRITE_ACCESS_LEVELS = [
  RecordShareAccessLevel.READ_WRITE,
  RecordShareAccessLevel.FULL,
];

const MAX_INHERITANCE_DEPTH = 8;

export const buildRecordShareGate = ({
  context,
  target,
  buildParentPolicy,
}: {
  context: RowAccessPolicyContext;
  target: RowAccessPolicyTarget;
  buildParentPolicy: (parentTarget: RowAccessPolicyTarget) => RowAccessPolicy;
}): RowAccessPolicy => {
  const { subject } = context;
  const { flatObjectMetadata, operationType } = target;

  if (subject.isOwningApplication(flatObjectMetadata)) {
    if (
      flatObjectMetadata.readability === MetadataReadability.APPLICATION ||
      flatObjectMetadata.readability === MetadataReadability.INHERITED
    ) {
      return { kind: 'open' };
    }
  }

  if (flatObjectMetadata.readability === MetadataReadability.APPLICATION) {
    return { kind: 'denied' };
  }

  if (
    flatObjectMetadata.readability === MetadataReadability.SYSTEM ||
    !isDefined(flatObjectMetadata.readability)
  ) {
    return { kind: 'open' };
  }

  if (flatObjectMetadata.readability === MetadataReadability.INHERITED) {
    return buildInheritedGate({ context, target, buildParentPolicy });
  }

  if (flatObjectMetadata.readability === MetadataReadability.PRIVATE) {
    return buildPrivateGate(context, target);
  }

  return buildOpenGate(context, target, operationType);
};

const buildOpenGate = (
  context: RowAccessPolicyContext,
  target: RowAccessPolicyTarget,
  operationType: RowAccessPolicyTarget['operationType'],
): RowAccessPolicy => {
  const sharing = resolveObjectSharing({
    flatObjectMetadata: target.flatObjectMetadata,
    featureFlagsMap: context.environment.featureFlagsMap,
  });

  if (
    target.flatObjectMetadata.isSystem === true ||
    operationType === 'insert' ||
    context.subject.canAccessAllRecords ||
    sharing.sharingMode !== RecordSharingMode.OPEN_BY_DEFAULT
  ) {
    return { kind: 'open' };
  }

  return {
    kind: 'gated',
    expression: {
      kind: 'recordNotRestricted',
      ...shareTarget(context, target, READ_ACCESS_LEVELS),
    },
  };
};

const buildPrivateGate = (
  context: RowAccessPolicyContext,
  target: RowAccessPolicyTarget,
): RowAccessPolicy => {
  const principalIds = context.subject.principalIds;

  if (!isDefined(principalIds) || principalIds.length === 0) {
    return { kind: 'open' };
  }

  const accessLevels =
    target.operationType === 'select' || target.operationType === 'insert'
      ? READ_ACCESS_LEVELS
      : WRITE_ACCESS_LEVELS;

  return {
    kind: 'gated',
    expression: {
      kind: 'recordShared',
      ...shareTarget(context, target, accessLevels),
    },
  };
};

const buildInheritedGate = ({
  context,
  target,
  buildParentPolicy,
}: {
  context: RowAccessPolicyContext;
  target: RowAccessPolicyTarget;
  buildParentPolicy: (parentTarget: RowAccessPolicyTarget) => RowAccessPolicy;
}): RowAccessPolicy => {
  if (target.depth > MAX_INHERITANCE_DEPTH) {
    return buildPrivateGate(context, target);
  }

  const parents = resolveInheritedReadabilityParents({
    flatObjectMetadata: target.flatObjectMetadata,
    flatFieldMetadataMaps: context.environment.flatFieldMetadataMaps,
    flatObjectMetadataMaps: context.environment.flatObjectMetadataMaps,
  });

  const parentExpressions = parents.flatMap(
    (parent): InheritedReadabilityParentExpression[] => {
      const parentObject =
        parent.kind === 'column'
          ? parent.parentFlatObjectMetadata
          : parent.childFlatObjectMetadata;

      if (!isParentAdmitted({ context, target, parentObject })) {
        return [];
      }

      if (parent.kind === 'column') {
        const parentTableAlias = buildPostgresSafeAlias(
          `${target.tableAlias}_${parent.joinColumnName}`,
        );
        const expression: InheritedReadabilityParentExpression = {
          kind: 'column',
          joinColumnName: parent.joinColumnName,
          parentTableAlias,
          parentFlatObjectMetadata: parent.parentFlatObjectMetadata,
          policy: buildParentPolicy({
            tableAlias: parentTableAlias,
            flatObjectMetadata: parent.parentFlatObjectMetadata,
            operationType: target.operationType,
            depth: target.depth + 1,
          }),
        };

        return expression.policy.kind === 'denied' ? [] : [expression];
      }

      const childTableAlias = buildPostgresSafeAlias(
        `${target.tableAlias}_${parent.childFlatObjectMetadata.nameSingular}`,
      );
      const expression: InheritedReadabilityParentExpression = {
        kind: 'children',
        childTableAlias,
        childJoinColumnName: parent.childJoinColumnName,
        childFlatObjectMetadata: parent.childFlatObjectMetadata,
        policy: buildParentPolicy({
          tableAlias: childTableAlias,
          flatObjectMetadata: parent.childFlatObjectMetadata,
          operationType: target.operationType,
          depth: target.depth + 1,
        }),
      };

      return expression.policy.kind === 'denied' ? [] : [expression];
    },
  );

  if (parentExpressions.length === 0) {
    return buildPrivateGate(context, target);
  }

  return {
    kind: 'gated',
    expression: {
      kind: 'inheritedReadability',
      parents: parentExpressions,
      isOpenWhenDetached: true,
      ...shareTarget(context, target, READ_ACCESS_LEVELS),
    },
  };
};

const isParentAdmitted = ({
  context,
  target,
  parentObject,
}: {
  context: RowAccessPolicyContext;
  target: RowAccessPolicyTarget;
  parentObject: RowAccessPolicyTarget['flatObjectMetadata'];
}): boolean => {
  if (
    target.operationType !== 'select' &&
    !isMetadataWritePermitted({
      writability: parentObject.writability,
      isSystemContext: false,
      isOwningApplication: context.subject.isOwningApplication(parentObject),
    })
  ) {
    return false;
  }

  if (!isDefined(context.subject.objectsPermissions)) {
    return true;
  }

  return isObjectOperationPermitted({
    objectMetadata: parentObject,
    operationType: 'select',
    objectsPermissions: context.subject.objectsPermissions,
  });
};

const shareTarget = (
  context: RowAccessPolicyContext,
  target: RowAccessPolicyTarget,
  accessLevels: RecordShareAccessLevel[],
): RecordShareExpressionTarget => ({
  tableAlias: target.tableAlias,
  objectMetadataId: target.flatObjectMetadata.id,
  principalIds: context.subject.principalIds ?? [],
  accessLevels,
});
