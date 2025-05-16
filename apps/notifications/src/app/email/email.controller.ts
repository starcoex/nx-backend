import { Controller, UseInterceptors } from '@nestjs/common';
import { EmailService } from './email.service';
import {
  GrpcLoggingInterceptor,
  NotificationsServiceController,
  NotificationsServiceControllerMethods,
} from '@starcoex-backend/grpc';
import { MailgunEmailInput } from './dto/mailgun-email.input';

@Controller()
@NotificationsServiceControllerMethods()
@UseInterceptors(GrpcLoggingInterceptor)
export class EmailController implements NotificationsServiceController {
  constructor(private readonly emailService: EmailService) {}

  async notifyEmail(data: MailgunEmailInput) {
    await this.emailService.notifyEmail(data);
  }
}
