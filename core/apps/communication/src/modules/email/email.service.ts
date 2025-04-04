import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import axios from 'axios';
import {
  ERRORS,
  MESSAGES,
  TemplateNames,
} from '@ontrack-tech-group/common/constants';
import { IncidentAlertInterface } from '@Common/interfaces';
import { emailSender, sendEmailUsingTemplate } from './helpers';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    // Set your SendGrid API key here
    sgMail.setApiKey(process.env.C_SENDGRID_PASSWORD);
  }

  async publicContactPage(emailInterface: any) {
    if (this.configService.get('EMAIL_UPDATES') === 'true') {
      // Read the email template from the local file
      const templatePath = path.join(
        __dirname,
        `./hbs/${TemplateNames.PUBLIC_CONTACT_PAGE}.hbs`,
      );

      const emailResponse = emailSender(
        emailInterface,
        templatePath,
        'Public Contact Page',
      );

      return {
        message: emailResponse
          ? 'Email Has Been Sent Successfully'
          : 'Something Went Wrong',
      };
    } else return { message: 'Email Updates are Disabled' };
  }

  async requestEventEmail(emailInterface: any) {
    if (this.configService.get('EMAIL_UPDATES') === 'true') {
      // Read the email template from the local file
      const templatePath = path.join(
        __dirname,
        `./hbs/${TemplateNames.EVENT_REQUEST}.hbs`,
      );

      const emailResponse = emailSender(
        emailInterface,
        templatePath,
        'Request Event',
      );

      return {
        message: emailResponse
          ? 'Email Has Been Sent Successfully'
          : 'Something Went Wrong',
      };
    } else return { message: 'Email Updates are Disabled' };
  }

  async sendEmail(
    emailInterface: any,
    templateName: TemplateNames,
    subject: string,
    threadId?: string,
  ) {
    if (this.configService.get('EMAIL_UPDATES') === 'true') {
      // Read the email template from the local file
      const templatePath = path.join(__dirname, `./hbs/${templateName}.hbs`);

      const emailResponse = emailSender(
        emailInterface,
        templatePath,
        subject,
        threadId,
      );

      return {
        message: emailResponse
          ? 'Email Has Been Sent Successfully'
          : 'Something Went Wrong',
      };
    } else return { message: 'Email Updates are Disabled' };
  }

  async incidentAlerts(incidentAlertInterface: IncidentAlertInterface) {
    if (this.configService.get('EMAIL_UPDATES') === 'true') {
      const { emails, data } = incidentAlertInterface.body;
      // Read the email template from the local file
      const templatePath = path.join(
        __dirname,
        `./hbs/${TemplateNames.INCIDENT_ALERT}.hbs`,
      );

      const emailResponse = await sendEmailUsingTemplate(
        data,
        templatePath,
        'OnTrack Event',
        emails,
      );

      return {
        message: emailResponse
          ? 'Email Has Been Sent Successfully'
          : 'Something Went Wrong',
      };
    } else return { message: 'Email Updates are Disabled' };
  }

  async sendReportingEmail(emailData: any) {
    const { pdfUrl, csvData, recipientEmails, content } = emailData;
    const attachments = [];

    if (pdfUrl) {
      const pdfResponse = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
      });
      const pdfBuffer = Buffer.from(pdfResponse.data);
      const pdfBase64 = pdfBuffer.toString('base64');

      attachments.push({
        content: pdfBase64,
        filename: 'incidents.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      });
    }

    if (csvData) {
      const csvBuffer = Buffer.from(`${csvData}`, 'utf-8');
      const csvBase64 = csvBuffer.toString('base64');

      attachments.push({
        content: csvBase64,
        filename: 'incidents.csv',
        type: 'text/csv',
        disposition: 'attachment',
      });
    }

    const templatePath = path.join(
      __dirname,
      `./hbs/${TemplateNames.REPORTING}.hbs`,
    );

    const emailResponse = await sendEmailUsingTemplate(
      content,
      templatePath,
      'Ontrack Incident Reports',
      recipientEmails,
      attachments,
    );

    return {
      message: emailResponse
        ? MESSAGES.EMAIL_HAS_BEEN_SENT_SUCCESSFULLY
        : ERRORS.SOMETHING_WENT_WRONG,
    };
  }
}
