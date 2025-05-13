import { ObjectType, Field } from '@nestjs/graphql';

// 성공 여부를 반환하기 위한 GraphQL Object Type
@ObjectType()
export class BooleanOutput {
  @Field(() => Boolean)
  success: boolean; // Boolean 필드로 작업 성공 여부를 반환
}
