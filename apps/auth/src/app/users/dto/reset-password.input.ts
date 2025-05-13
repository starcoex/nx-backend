import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';
import { IsString } from 'class-validator';

// GraphQL 필드 설정 상수 (재사용 가능)
const STRING_FIELD_OPTIONS = { nullable: true };

// ResetPasswordInput 클래스: activationCode 리네이밍, PickType 간소화
@InputType()
export class ResetPasswordInput {
  @Field(() => String)
  @IsString()
  password: string;

  @Field(() => String)
  @IsString()
  passwordConfirmation: string;

  @Field(() => String, STRING_FIELD_OPTIONS)
  @IsString()
  activationToken: string; // CamelCase 수정
}

// ResetPasswordOutput 클래스: 구조 유지
@ObjectType()
export class ResetPasswordOutput extends AbstractOutEntity {
  @Field(() => User, { nullable: true })
  user?: User;
}
