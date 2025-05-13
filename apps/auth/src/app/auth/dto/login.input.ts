import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';
import { IsBoolean, IsOptional } from 'class-validator';
import { Activation } from '../../users/entities/activation.entity';

// 유저 로그인에 필요한 필드 정의 (재사용 가능 상수)
const USER_LOGIN_FIELDS = ['email', 'password', 'rememberMe'] as const;

// 로그인 입력을 위한 GraphQL 타입
@InputType()
export class LoginInput extends PartialType(
  PickType(User, USER_LOGIN_FIELDS)
) {}

// 로그인 출력 결과를 위한 GraphQL 타입
@ObjectType()
export class LoginOutput extends AbstractOutEntity {
  /** 로그인된 유저 정보 */
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Activation, { nullable: true })
  activation?: Activation;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  twoFactorRequired?: boolean;

  /** JWT 액세스 토큰 */
  @Field(() => String, { nullable: true })
  accessToken?: string;

  /** JWT 리프레시 토큰 */
  @Field(() => String, { nullable: true })
  refreshToken?: string;

  @Field({ nullable: true })
  twoFactorToken?: string;
}
