import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * To send SMS to a number
   * @param number
   * @returns Promise boolean|string
   */
  public async sendPin(code: string, number: string) {
    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const apiKeySid = this.configService.get('TWILIO_KEY_SID');
      const apiKeySecret = this.configService.get('TWILIO_KEY_SECRET');
      const twilioVerifySid = this.configService.get('TWILIO_VERIFY_SID');

      const client = new Twilio(apiKeySid, apiKeySecret, { accountSid });
      await this._sendVerificationCode(code, number, twilioVerifySid, client);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * verify pin from twi
   * @param pin
   * @param code
   * @param number
   * @returns
   */
  public async verifyPin(pin: string, code: string, number: string) {
    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const apiKeySid = this.configService.get('TWILIO_KEY_SID');
      const apiKeySecret = this.configService.get('TWILIO_KEY_SECRET');
      const twilioVerifySid = this.configService.get('TWILIO_VERIFY_SID');

      const client = new Twilio(apiKeySid, apiKeySecret, { accountSid });

      const { status } = await client.verify.v2
        .services(twilioVerifySid)
        .verificationChecks.create({ to: `${code}${number}`, code: pin });

      return status === 'approved';
    } catch (err) {
      return false;
    }
  }

  private async _sendVerificationCode(
    code: string,
    number: string,
    twilioVerifySid: string,
    client: Twilio,
  ) {
    await client.verify.v2.services(twilioVerifySid).verifications.create({
      to: `${code}${number}`,
      channel: 'sms',
    });
  }
}
