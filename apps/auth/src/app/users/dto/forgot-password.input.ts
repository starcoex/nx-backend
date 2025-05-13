import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';

// 클래스 이름 및 목적을 더 명확히 표현하도록 수정
@InputType()
export class ForgotPasswordEmailInput extends PickType(User, ['email']) {}

// 공통 응답 형태를 위해 AbstractOutEntity 상속, 의미적 이름 변경
@ObjectType()
export class ForgotPasswordResponse extends AbstractOutEntity {
  @Field(() => String, {
    nullable: true,
    description: '상태 메시지(성공/실패)',
  })
  statusMessage?: string;
}
