import { msg } from '@lingui/core/macro';
import {
  RecordShareAccessLevel,
  RecordSharePrincipalType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FlatWorkspaceMemberMaps } from 'src/engine/core-modules/user/types/flat-workspace-member-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatRoleMaps } from 'src/engine/metadata-modules/flat-role/types/flat-role-maps.type';
import { GRANTABLE_RECORD_SHARE_ACCESS_LEVELS } from 'src/engine/core-modules/record-share/constants/grantable-record-share-access-levels.constant';
import {
  RecordShareException,
  RecordShareExceptionCode,
} from 'src/engine/core-modules/record-share/record-share.exception';

type ShareWithPrincipal = {
  workspaceMemberId?: string;
  roleId?: string;
  accessLevel: RecordShareAccessLevel;
};

export type ResolvedRecordSharePrincipal = {
  principalId: string;
  principalType: RecordSharePrincipalType;
  accessLevel: RecordShareAccessLevel;
};

export const validateShareWithPrincipalsOrThrow = ({
  shareWith,
  flatWorkspaceMemberMaps,
  flatRoleMaps,
}: {
  shareWith: ShareWithPrincipal[];
  flatWorkspaceMemberMaps: FlatWorkspaceMemberMaps;
  flatRoleMaps: FlatRoleMaps;
}): ResolvedRecordSharePrincipal[] =>
  shareWith.map((share) => {
    if (isDefined(share.workspaceMemberId) && isDefined(share.roleId)) {
      throw new RecordShareException(
        'A share must name a workspace member or a role, not both',
        RecordShareExceptionCode.INVALID_SHARE_WITH,
        { userFriendlyMessage: msg`Choose who to share this record with.` },
      );
    }

    if (
      share.accessLevel === RecordShareAccessLevel.NONE ||
      !GRANTABLE_RECORD_SHARE_ACCESS_LEVELS.includes(share.accessLevel)
    ) {
      throw new RecordShareException(
        `Access level "${share.accessLevel}" cannot be granted`,
        RecordShareExceptionCode.INVALID_SHARE_WITH,
        { userFriendlyMessage: msg`Choose a valid access level.` },
      );
    }

    if (isDefined(share.workspaceMemberId)) {
      if (!isDefined(flatWorkspaceMemberMaps.byId[share.workspaceMemberId])) {
        throw new RecordShareException(
          `Workspace member ${share.workspaceMemberId} was not found`,
          RecordShareExceptionCode.INVALID_SHARE_WITH,
          {
            userFriendlyMessage: msg`Choose a workspace member to share with.`,
          },
        );
      }

      return {
        principalId: share.workspaceMemberId,
        principalType: RecordSharePrincipalType.WORKSPACE_MEMBER,
        accessLevel: share.accessLevel,
      };
    }

    if (isDefined(share.roleId)) {
      if (
        !isDefined(
          findFlatEntityByIdInFlatEntityMaps({
            flatEntityId: share.roleId,
            flatEntityMaps: flatRoleMaps,
          }),
        )
      ) {
        throw new RecordShareException(
          `Role ${share.roleId} was not found`,
          RecordShareExceptionCode.INVALID_SHARE_WITH,
          { userFriendlyMessage: msg`Choose a role to share with.` },
        );
      }

      return {
        principalId: share.roleId,
        principalType: RecordSharePrincipalType.ROLE,
        accessLevel: share.accessLevel,
      };
    }

    throw new RecordShareException(
      'A share must name a workspace member or a role',
      RecordShareExceptionCode.INVALID_SHARE_WITH,
      { userFriendlyMessage: msg`Choose who to share this record with.` },
    );
  });
