import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

// 공통 인터페이스 추출
export interface CreateUserRequest {
  id: string;
  email: string;
  name: string;
  password: string;
  phoneNumber?: string;
  avatar?: string;
}

// 공통 데코레이터 그룹 상수화
export const FieldValidators = {
  id: IsString,
  email: IsEmail,
  name: IsString,
  password: IsStrongPassword,
};

// 클래스 리팩토링
export class CreateUserRequestInput implements CreateUserRequest {
  @FieldValidators.id()
  id: string;

  @FieldValidators.email()
  email: string;

  @FieldValidators.name()
  name: string;

  @FieldValidators.password()
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
