import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as SendGrid from "@sendgrid/mail";

@Injectable()
export class SendgridService {
  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get("SEND_GRID_KEY"));
  }

  async send(mail: SendGrid.MailDataRequired) {
    try {
      await SendGrid.send(mail);
      return { message: `E-Mail sent to ${mail.to}` };
    } catch (error: any) {
      console.error(error);
      return error;
    }
  }
}
