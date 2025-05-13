import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class ResendVerificationCodeInput extends PickType(User, ['email']) {}

@ObjectType()
export class ResendVerificationCodeOutput extends AbstractOutEntity {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field()
  @IsString()
  @IsOptional()
  activationCode?: string;

  @Field()
  @IsString()
  @IsOptional()
  activationToken?: string;
}
