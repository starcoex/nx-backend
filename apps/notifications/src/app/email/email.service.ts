import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as ejs from 'ejs';
import { MailgunMessageData, MailgunService } from 'nestjs-mailgun';
import { ConfigService } from '@nestjs/config';
import { MailgunEmailInput } from './dto/mailgun-email.input';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailgunService: MailgunService,
    private readonly configService: ConfigService
  ) {}

  async notifyEmail({
    email,
    subject,
    templatePath,
    data,
    activationCode,
    name,
  }: MailgunEmailInput) {
    const file = await fs.readFile(templatePath, 'utf8');
    const html = ejs.render(file, { email, name, activationCode, ...data });

    try {
      const emailData: MailgunMessageData = {
        from: this.configService.getOrThrow('MAILGUN_FROM'),
        to: email,
        name,
        subject,
        html,
        activationCode,
      };
      return await this.mailgunService.createEmail(
        this.configService.getOrThrow('MAILGUN_DOMAIN'),
        emailData
      );
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
