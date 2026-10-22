import { Field, InputType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { RowLevelPermissionPredicateGroupInput } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate-group.dto';
import { RowLevelPermissionPredicateInput } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate.dto';

@InputType('UpsertRowLevelPermissionPredicatesInput')
export class UpsertRowLevelPermissionPredicatesInput {
  @Field(() => UUIDScalarType)
  objectMetadataId: string;

  @Field(() => [RowLevelPermissionPredicateGroupInput])
  predicateGroups: RowLevelPermissionPredicateGroupInput[];

  @Field(() => [RowLevelPermissionPredicateInput])
  predicates: RowLevelPermissionPredicateInput[];

  @Field(() => UUIDScalarType)
  roleId: string;
}

export type { RowLevelPermissionPredicateInput };
export type { RowLevelPermissionPredicateGroupInput };
