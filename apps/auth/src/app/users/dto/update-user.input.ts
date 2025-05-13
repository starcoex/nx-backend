import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';

// 재사용 가능한 필드 리스트 상수 추출
const UpdatableUserFields: (keyof User)[] = ['email', 'name', 'phoneNumber'];

// 클래스 및 필드 이름 변경: 의미를 명확히 함
@InputType()
export class UpdateUserInput extends PartialType(
  PickType(User, UpdatableUserFields)
) {}

// 별도의 클래스 이름 변경 및 구체화
@ObjectType()
export class UpdateUserOutput extends AbstractOutEntity {
  @Field(() => User, { nullable: true })
  user?: User;
}
