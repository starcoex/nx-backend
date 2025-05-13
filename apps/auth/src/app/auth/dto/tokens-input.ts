import { Field, InputType, ObjectType } from '@nestjs/graphql';

const NullableStringField = () => Field(() => String, { nullable: true });

@InputType()
export class RefreshTokensInput {
  @Field()
  id: number;

  @Field()
  refreshToken: string;
}

@ObjectType()
export class RefreshTokensOutput {
  @NullableStringField()
  accessToken?: string;

  @NullableStringField()
  refreshToken?: string;

  @NullableStringField()
  error?: string;

  @Field(() => Boolean)
  ok: boolean;
}
