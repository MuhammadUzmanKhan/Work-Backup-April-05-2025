import { CloneEventDto, ImportEventDto } from '@Modules/event/dto';

export const cloneEvent = {
  type: CloneEventDto,
  examples: {
    Example: {
      value: {
        start_date: '2024-01-01',
        end_date: '2024-02-01',
        name: 'ABC Event',
      },
    },
  },
};

export const importEvent = {
  type: ImportEventDto,
  examples: {
    Example: {
      value: {
        source_event_id: 2108,
      },
    },
  },
};
