import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';

// constants/user-fields.constant.ts
export const USER_INPUT_FIELDS = [
  'email',
  'password',
  'passwordConfirmation',
  'phoneNumber',
  'name',
  'roles',
] as const;

@InputType()
export class CreateUserInput extends PickType(User, [
  'email',
  'password',
  'name',
  'passwordConfirmation',
  'phoneNumber',
  'roles',
]) {}

@ObjectType()
export class CreateUserOutput extends AbstractOutEntity {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => String, { nullable: true })
  refreshToken?: string;

  @Field(() => String, { nullable: true })
  activationCode?: string;

  @Field(() => String, { nullable: true })
  activationToken?: string;
}
