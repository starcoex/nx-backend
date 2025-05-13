import { ObjectType, Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Activation } from './activation.entity';
import { registerEnumType } from '@nestjs/graphql';
import { Role } from '@prisma-clients/auth';
import { AbstractEntity } from '@nx-backend/graphql';

// 공통 유효성 메시지 상수
const UserValidationMessages = {
  NAME_REQUIRED: '이름은 필수입니다.',
  NAME_LENGTH: '이름은 최소 2글자 이상, 최대 30글자 이하입니다.',
  EMAIL_REQUIRED: '메일은 필수 입니다.',
  EMAIL_INVALID: '메일 형식이 잘못 되었습니다.',
  PASSWORD_REQUIRED: '비밀번호는 필수 입니다.',
  PASSWORD_MIN_LENGTH: '비밀번호는 최소 6자 이상이어야 합니다.',
  PASSWORD_COMPLEXITY:
    '비밀번호는 대문자 1자, 소문자 1자, 숫자 1자, 특수문자 1자 이상을 포함해야 합니다.',
  PHONE_REQUIRED: '번호는 필수입니다.',
  PHONE_INVALID: '번호가 한국이 아닙니다.',
};

export enum UserRoles {
  ADMIN = 'ADMIN',
  USER = 'USER',
  DELIVERY = 'DELIVERY',
}

// GraphQL Enum 등록
registerEnumType(UserRoles, {
  name: 'UserRoles', // GraphQL에서 Enum 이름
  description: '사용자 역할을 정의하는 Enum', // 설명
});

const defaultRoles: UserRoles = UserRoles.USER;

// Avatars 클래스 정의 간소화
@InputType('AvatarsInput', { isAbstract: true })
@ObjectType()
export class Avatar extends AbstractEntity {
  @Field()
  @IsString()
  public_id: string;

  @Field()
  @IsString()
  url: string;

  @Field(() => Int)
  @IsNumber()
  userId: number;
}

@InputType('UserInput', { isAbstract: true })
@ObjectType()
export class User extends AbstractEntity {
  @Field()
  @IsNotEmpty({ message: UserValidationMessages.NAME_REQUIRED })
  @IsString()
  @Length(2, 30, { message: UserValidationMessages.NAME_LENGTH })
  name: string;

  @Field()
  @IsNotEmpty({ message: UserValidationMessages.EMAIL_REQUIRED })
  @IsEmail({}, { message: UserValidationMessages.EMAIL_INVALID })
  email: string;

  @Field()
  @IsNotEmpty({ message: UserValidationMessages.PASSWORD_REQUIRED })
  @MinLength(6, { message: UserValidationMessages.PASSWORD_MIN_LENGTH })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    { message: UserValidationMessages.PASSWORD_COMPLEXITY }
  )
  password: string;

  @Field(() => String, { nullable: true })
  @ValidateIf((o) => o.passwordConfirmation != null)
  @IsNotEmpty()
  passwordConfirmation?: string;

  @Field()
  @IsNotEmpty({ message: UserValidationMessages.PHONE_REQUIRED })
  @IsPhoneNumber('KR', { message: UserValidationMessages.PHONE_INVALID })
  phoneNumber: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  rememberMe: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  isActive: boolean;

  @Field(() => UserRoles, { nullable: true, defaultValue: defaultRoles })
  // @IsEnum($Enums.Role) // 배열 요소가 UserRoles 유효한 값인지 확인
  @IsOptional()
  roles?: Role;

  @Field(() => Avatar, { nullable: true })
  avatar?: Avatar;

  @Field(() => Activation, { nullable: true })
  activation?: Activation;

  @Field({ nullable: true })
  @IsOptional()
  accessToken?: string;

  @Field({ nullable: true })
  @IsOptional()
  refreshToken?: string;
}
