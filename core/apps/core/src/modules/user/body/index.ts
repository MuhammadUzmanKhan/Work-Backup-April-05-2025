import {
  AssignDepartmentWithEventDto,
  AssignUnassignEventDto,
  CreateUserDto,
  CreateUserLocationDto,
  GetDepartmentsUsers,
  UpdateUserDto,
  UpdateUserSettingsDto,
  UpdateUserStatusDto,
} from '../dto';

export const createUserLocation = {
  type: CreateUserLocationDto,
  examples: {
    Example: {
      value: {
        user_id: 7,
        event_id: 2015,
        location: {
          latitude: '24.87927621502541',
          longitude: '67.16041464662665',
          distance: 0,
          eta: 'ETA',
          speed: 0,
          battery_level: 0.8999999761581421,
        },
      },
    },
  },
};

export const updateUser = {
  type: UpdateUserDto,
  examples: {
    'Update User Information with Company Data (iOS)': {
      value: {
        first_name: 'John',
        last_name: 'Doe',
        name: 'John Doe',
        cell: '4155551414',
        country_code: '+1',
        email: 'user@example.com',
        department_id: 1,
        user_company: {
          id: 1,
          role: 'admin',
          company_id: 1,
        },
        language_code: 'en',
      },
    },
    'Update User and Associate Multiple Events (Company ID is required in user_company Object)':
      {
        value: {
          user_company: {
            id: 1,
            role: 'admin',
            company_id: 6,
          },
          department_id: 661,
          multiple_events_association: [
            {
              event_id: 2015,
              should_activate: true,
            },
          ],
        },
      },
  },
};

export const createUser = {
  type: CreateUserDto,
  examples: {
    'Create New User In User Listing Module': {
      value: {
        first_name: 'John',
        last_name: 'Doe',
        name: 'John Doe',
        cell: '4155551414',
        country_code: '+1',
        email: 'user@example.com',
        department_id: 1,
        role: 'admin',
        company_id: 1,
        images: [],
      },
    },
    'Create New User and Associate Multiple Events': {
      value: {
        first_name: 'John',
        last_name: 'Doe',
        name: 'John Doe',
        cell: '4155551414',
        country_code: '+1',
        email: 'user@example.com',
        department_id: 1,
        role: 'admin',
        company_id: 1,
        multiple_events_association: [
          {
            event_id: 2015,
            should_activate: true,
          },
          {
            event_id: 2016,
            should_activate: false,
          },
          {
            event_id: 2017,
          },
        ],
      },
    },
  },
};

export const getDepartmentsUsers = {
  type: GetDepartmentsUsers,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        department_ids: [440, 572],
      },
    },
  },
};

export const assignUnassignEventBody = {
  type: AssignUnassignEventDto,
  examples: {
    Example: {
      value: {
        event_ids: [2015, 2523],
        user_ids: [2463, 2475],
      },
    },
  },
};

export const assignDepartmentWithEvent = {
  type: AssignDepartmentWithEventDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        department_id: 336,
        user_id: 440,
      },
    },
  },
};

export const updateUserSetting = {
  type: UpdateUserSettingsDto,
  examples: {
    Example: {
      value: {
        date_format: 'MM/DD/YY',
        time_format: '12 hour',
        language_code: 'en',
        temperature_format: 'C',
      },
    },
  },
};

export const updateUserStatus = {
  type: UpdateUserStatusDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        status: 'available',
      },
    },
  },
};
