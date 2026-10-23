import { SetMetadata } from '@nestjs/common';

import { ALLOW_PENDING_WORKSPACE_MEMBER_KEY } from 'src/engine/guards/constants/allow-pending-workspace-member-key.constant';

export const AllowPendingWorkspaceMember = () =>
  SetMetadata(ALLOW_PENDING_WORKSPACE_MEMBER_KEY, true);
