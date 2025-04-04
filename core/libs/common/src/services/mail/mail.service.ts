import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../models';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  async sendStaffUploadErrorMail(user: User, csvUrl: string) {
    const email = user.email || this.config.get('ONTRACK_MAIL');
    const subject = 'Event Upload Errors';

    await this.mailerService.sendMail({
      to: email,
      subject: subject,
      template: 'event-upload-errors', // The name of your email template
      context: {
        message: 'Following records have errors',
        csvUrl: csvUrl,
      },
    });
  }
}
