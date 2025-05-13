import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

// 공통 토큰 필드를 관리하는 인터페이스 추출
interface TokenFields {
  accessToken?: string;
  refreshToken?: string;
}

@InputType()
export class ActivationUserInput {
  @Field()
  @IsNotEmpty({ message: '활성화 토큰은 필수입니다.' })
  @IsString()
  activationCode: string;
}

@ObjectType()
export class ActivationUserOutput implements TokenFields {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshToken?: string;
}
