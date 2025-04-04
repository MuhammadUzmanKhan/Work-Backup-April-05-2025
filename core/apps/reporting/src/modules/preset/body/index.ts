import { ReportingFrequency } from '@Common/constants';
import { CreatePresetDto, UpdatePresetDto } from '../dto';

export const createPreset = {
  type: CreatePresetDto,
  examples: {
    'Example-1': {
      value: {
        event_id: 2015,
        name: 'Preset 1',
        email: 'test@gmail.com',
        frequency: ReportingFrequency.EVENT_COMPLETION,
        pdf: true,
        csv: true,
        buffer: 5,
        filters: {
          status: ['open', 'dispatched'],
          dispatched_status: ['in_route'],
          priority: ['low'],
          incident_division_ids: [255],
          incident_zone_ids: [4870],
          incident_type_ids: [894],
          resolution_status: ['arrest'],
          date: {
            start_date: '2024-07-25',
            end_date: '2024-07-29',
          },
        },
      },
    },
  },
};

export const updatePreset = {
  type: UpdatePresetDto,
  examples: {
    'Example-1': {
      value: {
        event_id: 2015,
        name: 'Preset 2',
        email: 'test@gmail.com',
        frequency: ReportingFrequency.EVENT_COMPLETION,
        pdf: true,
        csv: false,
        buffer: 5,
        filters: {
          status: ['open', 'dispatched'],
          dispatched_status: ['in_route'],
          priority: ['high'],
          incident_division_ids: [255],
          incident_zone_ids: [4870],
          incident_type_ids: [894],
          resolution_status: ['arrest'],
        },
      },
    },
    'Example-2': {
      value: {
        event_id: 2015,
        disabled: true,
      },
    },
  },
};
