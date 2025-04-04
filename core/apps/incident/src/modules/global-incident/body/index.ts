import { CreateGlobalIncidentDto } from '../dto';

export const createGlobalIncident = {
  type: CreateGlobalIncidentDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        incident_type_id: 7618,
        description: '',
        extra_info: {
          name: 'Harjot Singh CA (Prod)',
          phone_number: '4158298813',
          location: { latitude: 34.013462, longitude: -118.283104 },
        },
      },
    },
  },
};
