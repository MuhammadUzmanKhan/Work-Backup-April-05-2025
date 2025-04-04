import {
  ChangeNumberDto,
  CreatePinDto,
  ManageMfaDto,
  VerifyPinDto,
} from '../dto';

export const createPin = {
  type: CreatePinDto,
  examples: {
    Example: {
      value: {
        cell: '4155551414',
        country_code: '+1',
      },
    },
  },
};

export const verifyPin = {
  type: VerifyPinDto,
  examples: {
    Example: {
      value: {
        cell: '4155551414',
        pin: '9090',
        country_code: '+1',
      },
    },
  },
};

export const manageMfa = {
  type: ManageMfaDto,
  examples: {
    Example: {
      value: {
        user_id: '7',
      },
    },
  },
};

export const changeNumber = {
  type: ChangeNumberDto,
  examples: {
    Example: {
      value: {
        old_cell: '4155551414',
        old_country_code: '+1',
        new_cell: '4155551415',
        new_country_code: '+2',
        confirm_new_cell: '4155551415',
        confirm_new_country_code: '+2',
      },
    },
  },
};
