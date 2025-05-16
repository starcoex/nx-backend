import { IsEmail, IsString } from 'class-validator';

export class NodeMailerInput {
  @IsEmail()
  email: string;

  @IsString()
  text: string;
}

export class NodeMailerTemplateInput {
  @IsString()
  subject: string;

  @IsString()
  name: string;

  @IsString()
  activationCode: string;

  @IsString()
  template: string;

  @IsEmail()
  @IsString()
  email: string;
}
