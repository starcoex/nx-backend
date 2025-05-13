import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

@ObjectType({ isAbstract: true })
export class AbstractEntity {
  @Field(() => Int)
  id: number;

  @IsDate()
  @Type(() => Date)
  @Field(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType({ isAbstract: true })
export class AbstractOutEntity {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  error?: string;

  @Field(() => Boolean)
  @IsBoolean()
  ok: boolean;
}
