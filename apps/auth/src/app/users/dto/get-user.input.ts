import { InputType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

// Extract the field to a constant for reusability and clarity
const USER_ID_FIELD: (keyof User)[] = ['id'];

@InputType()
export class UserIdInput extends PickType(User, USER_ID_FIELD) {}
