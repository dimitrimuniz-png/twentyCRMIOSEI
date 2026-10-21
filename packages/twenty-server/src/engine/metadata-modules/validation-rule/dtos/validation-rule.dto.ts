import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('ValidationRule')
export class ValidationRuleDTO {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  errorFieldMetadataId?: string | null;

  @Field()
  expression: string;

  @Field(() => String, { nullable: true })
  icon?: string | null;

  @Field()
  isActive: boolean;

  @Field()
  message: string;

  @Field()
  name: string;

  @Field(() => UUIDScalarType)
  objectMetadataId: string;
}

@InputType('CreateValidationRuleInput')
export class CreateValidationRuleInput {
  @Field({ nullable: true })
  description?: string;

  @Field(() => UUIDScalarType, { nullable: true })
  errorFieldMetadataId?: string;

  @Field()
  expression: string;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field()
  message: string;

  @Field()
  name: string;

  @Field(() => UUIDScalarType)
  objectMetadataId: string;
}

@InputType('UpdateValidationRuleInputUpdates')
export class UpdateValidationRuleInputUpdates {
  @Field({ nullable: true })
  description?: string;

  @Field(() => UUIDScalarType, { nullable: true })
  errorFieldMetadataId?: string;

  @Field({ nullable: true })
  expression?: string;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  name?: string;
}

@InputType('UpdateValidationRuleInput')
export class UpdateValidationRuleInput {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => UpdateValidationRuleInputUpdates)
  update: UpdateValidationRuleInputUpdates;
}
