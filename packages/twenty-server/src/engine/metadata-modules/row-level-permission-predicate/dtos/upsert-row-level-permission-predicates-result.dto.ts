import { Field, ObjectType } from '@nestjs/graphql';

import { RowLevelPermissionPredicateGroupDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate-group.dto';
import { RowLevelPermissionPredicateDTO } from 'src/engine/metadata-modules/row-level-permission-predicate/dtos/row-level-permission-predicate.dto';

@ObjectType('UpsertRowLevelPermissionPredicatesResult')
export class UpsertRowLevelPermissionPredicatesResultDTO {
  @Field(() => [RowLevelPermissionPredicateGroupDTO])
  predicateGroups: RowLevelPermissionPredicateGroupDTO[];

  @Field(() => [RowLevelPermissionPredicateDTO])
  predicates: RowLevelPermissionPredicateDTO[];
}
