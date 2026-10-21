import { Field, Float, ID, InputType, ObjectType } from '@nestjs/graphql';

import { RowLevelPermissionPredicateGroupLogicalOperator } from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('RowLevelPermissionPredicateGroup')
export class RowLevelPermissionPredicateGroupDTO {
  @Field(() => ID)
  id: string;

  @Field(() => RowLevelPermissionPredicateGroupLogicalOperator)
  logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator;

  @Field()
  objectMetadataId: string;

  @Field(() => ID, { nullable: true })
  parentRowLevelPermissionPredicateGroupId?: string | null;

  @Field(() => Float, { nullable: true })
  positionInRowLevelPermissionPredicateGroup?: number | null;

  @Field()
  roleId: string;
}

@InputType('RowLevelPermissionPredicateGroupInput')
export class RowLevelPermissionPredicateGroupInput {
  @Field(() => UUIDScalarType, { nullable: true })
  id?: string;

  @Field(() => RowLevelPermissionPredicateGroupLogicalOperator)
  logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator;

  @Field(() => UUIDScalarType)
  objectMetadataId: string;

  @Field(() => UUIDScalarType, { nullable: true })
  parentRowLevelPermissionPredicateGroupId?: string | null;

  @Field(() => Float, { nullable: true })
  positionInRowLevelPermissionPredicateGroup?: number | null;
}
