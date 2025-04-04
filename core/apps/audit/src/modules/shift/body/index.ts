import { CreateShiftDto, UpdateShiftDto } from '../dto';

export const createShift = {
  type: CreateShiftDto,
  examples: {
    Example1: {
      value: {
        name: 'Morning Shift',
        event_id: 2015,
        end_dates: [
          '2024-01-22T19:00:00.515Z',
          '2024-01-23T19:00:00.515Z',
          '2024-01-24T19:00:00.515Z',
        ],
        start_dates: [
          '2024-01-22T12:00:00.515Z',
          '2024-01-23T12:00:00.515Z',
          '2024-01-24T12:00:00.515Z',
        ],
      },
    },
    Example2: {
      value: {
        name: 'Morning Shift',
        event_id: 2015,
        end_dates: ['2024-01-22T19:00:00.515Z'],
        start_dates: ['2024-01-22T12:00:00.515Z'],
      },
    },
  },
};

export const updateShift = {
  type: UpdateShiftDto,
  examples: {
    Example: {
      value: {
        name: 'Morning Shift',
        start_date: '2024-01-23T05:33:15Z',
        end_date: '2024-01-23T21:33:15Z',
      },
    },
  },
};
