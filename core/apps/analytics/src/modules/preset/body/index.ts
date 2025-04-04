import { CreatePresetDto } from '../dto';

export const createPreset = {
  type: CreatePresetDto,
  examples: {
    'Example-1': {
      value: {
        event_id: 2015,
        name: 'Report_name_base',
        email: 'user@example.com',
        day: 'every_day',
        frequency: 'weekly',
        pdf: true,
        csv: false,
        export_time: '09:10',
        filters: {
          incident_filters: {
            incident_division_ids: [300, 210],
            incident_type_ids: [1017, 1919],
            priority: ['low', 'medium'],
            incident_status: ['open', 'resolved'],
          },
          event_filters: {
            company_ids: [1],
            event_regions_ids: [2],
            event_ids: [2015],
            event_statuses: ['upcoming', 'in_progress'],
          },
          date: {
            start_date: '2020-06-17T12:30:45Z',
            end_date: '2024-06-17T12:30:45Z',
          },
        },
      },
    },
  },
};
