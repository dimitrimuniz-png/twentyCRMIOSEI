import {
  Field,
  Float,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import { GraphQLJSON } from 'graphql-type-json';
import {
  RowLevelPermissionPredicateGroupLogicalOperator,
  RowLevelPermissionPredicateOperand,
} from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

registerEnumType(RowLevelPermissionPredicateOperand, {
  name: 'RowLevelPermissionPredicateOperand',
});

registerEnumType(RowLevelPermissionPredicateGroupLogicalOperator, {
  name: 'RowLevelPermissionPredicateGroupLogicalOperator',
});

@ObjectType('RowLevelPermissionPredicate')
export class RowLevelPermissionPredicateDTO {
  @Field(() => ID)
  id: string;

  @Field()
  fieldMetadataId: string;

  @Field()
  objectMetadataId: string;

  @Field(() => RowLevelPermissionPredicateOperand)
  operand: RowLevelPermissionPredicateOperand;

  @Field(() => Float, { nullable: true })
  positionInRowLevelPermissionPredicateGroup?: number | null;

  @Field()
  roleId: string;

  @Field({ nullable: true })
  rowLevelPermissionPredicateGroupId?: string | null;

  @Field({ nullable: true })
  subFieldName?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  value?: unknown;

  @Field({ nullable: true })
  workspaceMemberFieldMetadataId?: string | null;

  @Field({ nullable: true })
  workspaceMemberSubFieldName?: string | null;
}

@InputType('RowLevelPermissionPredicateInput')
export class RowLevelPermissionPredicateInput {
  @Field(() => UUIDScalarType)
  fieldMetadataId: string;

  @Field(() => UUIDScalarType, { nullable: true })
  id?: string;

  @Field(() => RowLevelPermissionPredicateOperand)
  operand: RowLevelPermissionPredicateOperand;

  @Field(() => Float, { nullable: true })
  positionInRowLevelPermissionPredicateGroup?: number | null;

  @Field(() => UUIDScalarType, { nullable: true })
  rowLevelPermissionPredicateGroupId?: string | null;

  @Field({ nullable: true })
  subFieldName?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  value?: unknown;

  @Field({ nullable: true })
  workspaceMemberFieldMetadataId?: string | null;

  @Field({ nullable: true })
  workspaceMemberSubFieldName?: string | null;
}
