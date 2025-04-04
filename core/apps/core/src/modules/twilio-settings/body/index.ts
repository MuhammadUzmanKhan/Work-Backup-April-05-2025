import {
  AddTwilioConfigurationsDto,
  AddTwilioNumberDto,
  LinkEventTwilioNumberDto,
  UpdateTwilioNumberDto,
} from '../dto';

export const AddTwilioConfigurations = {
  type: AddTwilioConfigurationsDto,
  examples: {
    Example: {
      value: {
        company_id: 6,
        twilio_api_key_sid: 'SK1234567890abcdefghijklmnopqrstuv',
        twilio_api_key_secret: '1234567890abcdefghijklmnopqrstuv',
        twilio_account_sid: 'AC1234567890abcdefghijklmnopqrstuv',
      },
    },
  },
};

export const UpdateTwilioConfigurations = {
  type: AddTwilioConfigurationsDto,
  examples: {
    Example: {
      value: {
        twilio_api_key_sid: 'SK1234567890abcdefghijklmnopqrstuv',
        twilio_api_key_secret: '1234567890abcdefghijklmnopqrstuv',
        twilio_account_sid: 'AC1234567890abcdefghijklmnopqrstuv',
      },
    },
  },
};

export const AddTwilioNumber = {
  type: AddTwilioNumberDto,
  examples: {
    Example: {
      value: {
        company_id: 6,
        phone_number: '415555534',
        is_enabled: 'true',
      },
    },
  },
};

export const UpdateTwilioNumber = {
  type: UpdateTwilioNumberDto,
  examples: {
    Example: {
      value: {
        phone_number: '415555334',
        is_enabled: 'true',
      },
    },
  },
};

export const LinkEventTwilioNumber = {
  type: LinkEventTwilioNumberDto,
  examples: {
    Example: {
      value: {
        event_id: 6,
        twilio_number_id: 2,
        inbox_name: 'Inbox A',
      },
    },
  },
};
