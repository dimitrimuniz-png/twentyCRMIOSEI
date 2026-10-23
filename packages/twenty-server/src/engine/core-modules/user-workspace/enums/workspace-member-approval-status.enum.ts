import { registerEnumType } from '@nestjs/graphql';

export enum WorkspaceMemberApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(WorkspaceMemberApprovalStatus, {
  name: 'WorkspaceMemberApprovalStatus',
});
