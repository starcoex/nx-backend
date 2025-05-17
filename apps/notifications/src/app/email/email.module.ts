import { DynamicModule, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailgunModule } from 'nestjs-mailgun';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow('NODE_MAILER_SMTP_HOST'),
          secure: false,
          auth: {
            user: configService.getOrThrow('NODE_MAILER_SMTP_USER'),
            pass: configService.getOrThrow('NODE_MAILER_SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: '주)스타코엑스',
        },
        template: {
          dir: join(__dirname, '../../', '/email-templates'),
          adapter: new EjsAdapter({ inlineCssEnabled: true }),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
    MailgunModule.forAsyncRoot({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        username: configService.getOrThrow('MAILGUN_USERNAME'),
        domain: configService.getOrThrow('MAILGUN_DOMAIN'),
        key: configService.getOrThrow('MAILGUN_KEY'),
        publicKey: configService.getOrThrow('MAILGUN_PUBLIC_KEY'),
      }),
      inject: [ConfigService],
    }) as unknown as DynamicModule,
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
