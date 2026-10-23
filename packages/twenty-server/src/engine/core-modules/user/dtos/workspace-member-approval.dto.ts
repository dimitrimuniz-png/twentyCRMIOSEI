import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { WorkspaceMemberApprovalStatus } from 'src/engine/core-modules/user-workspace/enums/workspace-member-approval-status.enum';

@ObjectType('PendingWorkspaceMember')
export class PendingWorkspaceMemberDTO {
  @Field(() => UUIDScalarType)
  userWorkspaceId: string;

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  firstName: string | null;

  @Field(() => String, { nullable: true })
  lastName: string | null;

  @Field()
  createdAt: Date;
}

@ObjectType('WorkspaceMemberApproval')
export class WorkspaceMemberApprovalDTO {
  @Field(() => WorkspaceMemberApprovalStatus)
  approvalStatus: WorkspaceMemberApprovalStatus;

  @Field()
  isMemberApprovalRequired: boolean;
}

@ObjectType('MemberApprovalAssignableRole')
export class MemberApprovalAssignableRoleDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  label: string;
}
