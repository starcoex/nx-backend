import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';
import { IsNotEmpty, Matches, MinLength } from 'class-validator';

@InputType()
export class PasswordChangeInput {
  @Field(() => String)
  @IsNotEmpty({ message: '현재 비밀번호는 필수 항목입니다.' })
  currentPassword: string;

  @Field()
  @IsNotEmpty({ message: '비밀번호는 필수 입니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        '비밀번호는 대문자 1자, 소문자 1자, 숫자 1자, 특수문자 1자 이상을 포함해야 합니다.',
    }
  )
  newPassword: string;

  @Field(() => String)
  @IsNotEmpty({ message: '비밀번호 확인은 필수 항목입니다.' })
  newPasswordConfirmation: string;
}

@ObjectType()
export class PasswordChangeOutput extends AbstractOutEntity {
  @Field(() => User, { nullable: true })
  user?: User;
}
