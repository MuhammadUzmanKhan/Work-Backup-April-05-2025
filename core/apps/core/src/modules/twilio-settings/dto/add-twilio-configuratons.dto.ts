import { IsString, Matches } from 'class-validator';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';

export class AddTwilioConfigurationsDto extends CompanyIdDto {
  @IsString()
  @Matches(/^SK[a-zA-Z0-9]{32}$/, {
    message:
      'twilio_api_key_sid must start with "SK" followed by a 32-character alphanumeric string',
  })
  twilio_api_key_sid: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9]{32}$/, {
    message:
      'twilio_api_key_secret must be a 32-character alphanumeric string without any prefix',
  })
  twilio_api_key_secret: string;

  @IsString()
  @Matches(/^AC[a-zA-Z0-9]{32}$/, {
    message:
      'twilio_account_sid must start with "AC" followed by a 32-character alphanumeric string',
  })
  twilio_account_sid: string;
}

export class UpdateTwilioConfigurationsDto {
  @IsString()
  @Matches(/^SK[a-zA-Z0-9]{32}$/, {
    message:
      'twilio_api_key_sid must start with "SK" followed by a 32-character alphanumeric string',
  })
  twilio_api_key_sid: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9]{32}$/, {
    message:
      'twilio_api_key_secret must be a 32-character alphanumeric string without any prefix',
  })
  twilio_api_key_secret: string;

  @IsString()
  @Matches(/^AC[a-zA-Z0-9]{32}$/, {
    message:
      'twilio_account_sid must start with "AC" followed by a 32-character alphanumeric string',
  })
  twilio_account_sid: string;
}
