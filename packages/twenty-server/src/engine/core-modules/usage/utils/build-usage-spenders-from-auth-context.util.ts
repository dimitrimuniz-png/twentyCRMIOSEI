import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

type UsageSpenders = {
  userWorkspaceId?: string;
  apiKeyId?: string;
  applicationId?: string;
};

export const buildUsageSpendersFromAuthContext = (
  authContext: WorkspaceAuthContext | undefined,
): UsageSpenders => {
  if (!isDefined(authContext)) {
    return {};
  }

  if (authContext.type === 'apiKey') {
    return { apiKeyId: authContext.apiKey.id };
  }

  if (authContext.type === 'application') {
    return { applicationId: authContext.application.id };
  }

  if (authContext.type === 'user') {
    return {
      userWorkspaceId: authContext.userWorkspaceId,
      applicationId: authContext.viaApplication?.id,
    };
  }

  return {};
};
