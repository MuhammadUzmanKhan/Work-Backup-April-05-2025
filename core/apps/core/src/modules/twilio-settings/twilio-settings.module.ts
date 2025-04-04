import { Module } from '@nestjs/common';
import { TwilioSettingsController } from './twilio-settings.controller';
import { TwilioSettingsService } from './twilio-settings.service';

@Module({
  controllers: [TwilioSettingsController],
  providers: [TwilioSettingsService],
})
export class TwilioSettingsModule {}
