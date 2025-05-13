import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { AbstractOutEntity } from '@nx-backend/graphql';

@InputType()
export class UserLogoutInput {
  @Field(() => Number)
  @IsNotEmpty()
  id: number;
}

@ObjectType()
export class UserLogoutOutput extends AbstractOutEntity {}
