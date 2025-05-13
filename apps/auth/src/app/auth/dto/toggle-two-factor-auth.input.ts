import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Activation } from '../../users/entities/activation.entity';
import { AbstractOutEntity } from '@nx-backend/graphql';
import { IsString } from 'class-validator';

@InputType()
export class ToggleTwoFactorAuthInput extends PickType(Activation, [
  'twoFactorActivated',
]) {}

@ObjectType()
export class ToggleTwoFactorAuthOutput extends AbstractOutEntity {
  @Field({ nullable: true })
  @IsString()
  secret?: string;

  @Field({ nullable: true })
  @IsString()
  qrCode?: string;

  @Field(() => Activation, { nullable: true })
  activation?: Activation;
}
