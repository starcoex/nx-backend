import { Field, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@ObjectType()
export class Job {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  description: string;
}
