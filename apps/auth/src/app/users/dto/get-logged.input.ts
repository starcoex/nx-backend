import { Field, ObjectType } from '@nestjs/graphql';
import { AbstractOutEntity } from '@nx-backend/graphql';
import { User } from '../entities/user.entity';
import { Activation } from '../entities/activation.entity';

@ObjectType()
export class GetLoggedOutput extends AbstractOutEntity {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Activation, { nullable: true })
  activation?: Activation;
}
