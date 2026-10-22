import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('CustomAiProviderAccessDTO')
export class CustomAiProviderAccessDTO {
  @Field(() => Boolean)
  hasAccess: boolean;

  @Field(() => Int)
  seatCount: number;

  @Field(() => Int)
  seatThreshold: number;
}

@ObjectType('ModelsDevProviderSuggestion')
export class ModelsDevProviderSuggestionDTO {
  @Field(() => String)
  id: string;

  @Field(() => Float)
  modelCount: number;

  @Field(() => String)
  npm: string;
}

@ObjectType('ModelsDevModelSuggestion')
export class ModelsDevModelSuggestionDTO {
  @Field(() => String)
  modelId: string;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  inputCostPerMillionTokens: number;

  @Field(() => Float)
  outputCostPerMillionTokens: number;

  @Field(() => Float, { nullable: true })
  cachedInputCostPerMillionTokens?: number;

  @Field(() => Float, { nullable: true })
  cacheCreationCostPerMillionTokens?: number;

  @Field(() => Float)
  contextWindowTokens: number;

  @Field(() => Float)
  maxOutputTokens: number;

  @Field(() => [String])
  modalities: string[];

  @Field(() => Boolean)
  supportsReasoning: boolean;
}
