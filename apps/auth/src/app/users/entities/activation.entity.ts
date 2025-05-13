import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { AbstractEntity } from '@nx-backend/graphql';

@InputType('ActivationInput', { isAbstract: true })
@ObjectType()
export class Activation extends AbstractEntity {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  activationCode?: string; // 기존 activation_code -> 카멜케이스 변경

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  activationToken?: string; // 기존 activation_token -> 카멜케이스 변경

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  requestedEmail?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  twoFactorSecret?: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  @IsOptional()
  twoFactorActivated?: boolean;

  @Field(() => User, { nullable: true })
  user?: User; // 협회 관계, Optional
}
