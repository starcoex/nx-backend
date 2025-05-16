import { IsEmail, IsObject, IsString } from 'class-validator';

export class MailgunEmailInput {
  @IsString()
  subject: string;

  @IsObject()
  data: object;

  @IsString()
  activationCode: string;

  @IsString()
  templatePath: string;

  @IsEmail()
  @IsString()
  email: string;

  @IsString()
  name: string;
}
