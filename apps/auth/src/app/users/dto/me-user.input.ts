import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';

/**
 * Response type for the "me" query, encapsulating user-related data
 * and the status of the query.
 */
@ObjectType()
export class UserResponse extends AbstractOutEntity {
  /**
   * Holds user information, if available.
   * This field is optional and nullable.
   */
  @Field(() => User, { nullable: true })
  userData?: User;
}
