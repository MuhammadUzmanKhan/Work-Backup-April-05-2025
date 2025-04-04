import { Observable, of } from 'rxjs';
import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { MessagePattern } from '@nestjs/microservices';
import { IncidentAlertInterface } from '@Common/interfaces';
import { EmailService } from './email.service';

@ApiTags('Emails')
@ApiBearerAuth()
@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('public-contact')
  async sendPublicContactEmail(data: string): Promise<Observable<any>> {
    try {
      const decryptedEmailBody: any = decryptData(data['body']);

      const publicContactPage =
        await this.emailService.publicContactPage(decryptedEmailBody);

      return of(publicContactPage);
    } catch (error) {
      return of(error.response);
    }
  }

  @MessagePattern('request-event')
  async sendRequestEventEmail(data: string): Promise<Observable<any>> {
    try {
      const decryptedEmailBody: any = decryptData(data['body']);

      const publicContactPage =
        await this.emailService.requestEventEmail(decryptedEmailBody);

      return of(publicContactPage);
    } catch (error) {
      return of(error.response);
    }
  }

  @MessagePattern('send-email')
  async sendEmail(data: string): Promise<Observable<any>> {
    try {
      const decryptedEmailBody: any = decryptData(data['body']);
      const { data: _data, template, subject, threadId } = decryptedEmailBody;

      const publicContactPage = await this.emailService.sendEmail(
        _data,
        template,
        subject,
        threadId,
      );

      return of(publicContactPage);
    } catch (error) {
      return of(error.response);
    }
  }

  @MessagePattern('incident-alert')
  async sendIncidentAlertEmail(data: {
    body: string;
    user: string;
  }): Promise<Observable<any>> {
    try {
      const decryptedBody: IncidentAlertInterface = {
        body: decryptData(data.body),
      } as unknown as IncidentAlertInterface;

      const incidentAlerts =
        await this.emailService.incidentAlerts(decryptedBody);
      return of(incidentAlerts);
    } catch (error) {
      return of(error.response);
    }
  }

  @MessagePattern('send-reporting-email')
  async sendReportingEmail(data: {
    body: string;
    user: string;
  }): Promise<Observable<any>> {
    try {
      const decryptedBody = decryptData(data.body);

      const emailSentMessage =
        await this.emailService.sendReportingEmail(decryptedBody);
      return of(emailSentMessage);
    } catch (error) {
      return of(error.response);
    }
  }
}
