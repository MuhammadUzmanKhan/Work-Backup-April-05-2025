import {
  CloneDotDto,
  UploadDotsDto,
  UpdateDotDto,
  CopyDotDto,
  UpdateBulkDotsDto,
  SwapDotsDto,
  ResetDeploymentDto,
} from '../dto';

export const uploadDots = {
  type: UploadDotsDto,
  examples: {
    'Example 1': {
      value: {
        event_id: 2015,
        dots: [
          {
            pos_id: 'PERM-001',
            vendor: 'CISS',
            position: 'Manager',
            position_name: 'Event Manager',
            area: 'Gate 1',
            priority: true,
            shifts: [
              {
                start_date: '2024-08-22T12:00:00Z',
                end_date: '2024-08-22T19:00:00Z',
                rate: 20,
                quantity: 2,
              },
              {
                start_date: '2024-08-23T12:00:00Z',
                end_date: '2024-08-23T19:00:00Z',
                rate: 30,
                quantity: 1,
              },
            ],
          },
          {
            pos_id: 'PERM-002',
            vendor: 'CISS',
            position: 'Admin',
            position_name: 'Security office',
            area: 'Gate 2',
            priority: false,
            shifts: [
              {
                start_date: '2024-08-22T11:00:00Z',
                end_date: '2024-08-22T20:00:00Z',
                rate: 20,
                quantity: 1,
              },
              {
                start_date: '2024-08-22T11:00:00Z',
                end_date: '2024-08-22T20:00:00Z',
                rate: 40,
                quantity: 1,
              },
              {
                start_date: '2024-08-18T13:00:00Z',
                end_date: '2024-08-18T17:00:00Z',
                rate: 30,
                quantity: 1,
              },
              {
                start_date: '2024-08-23T12:00:00Z',
                end_date: '2024-08-23T19:00:00Z',
                rate: 50,
                quantity: 2,
              },
            ],
          },
        ],
        url: 'https://www.google.com',
        file_name: 'test.csv',
      },
    },
    'Example 2': {
      value: {
        event_id: 2015,
        dots: [
          {
            pos_id: 'PERM-004',
            vendor: 'CISS',
            position: 'Guard',
            position_name: 'Stage 1',
            area: 'Gate 2',
            priority: true,
            shifts: [
              {
                start_date: '2024-08-18T09:00:00Z',
                end_date: '2024-08-18T17:30:00Z',
                rate: 15,
                quantity: 2,
              },
              {
                start_date: '2024-08-19T13:00:00Z',
                end_date: '2024-08-19T21:00:00Z',
                rate: 25,
                quantity: 1,
              },
            ],
          },
          {
            pos_id: 'PERM-005',
            vendor: 'CISS',
            position: 'Guard',
            position_name: 'Stage 2',
            area: 'Gate 3',
            priority: false,
            shifts: [
              {
                start_date: '2024-08-24T14:00:00Z',
                end_date: '2024-08-24T20:00:00Z',
                rate: 20,
                quantity: 1,
              },
              {
                start_date: '2024-08-23T08:00:00Z',
                end_date: '2024-08-23T16:00:00Z',
                rate: 30,
                quantity: 1,
              },
              {
                start_date: '2024-08-22T13:00:00Z',
                end_date: '2024-08-22T23:00:00Z',
                rate: 50,
                quantity: 2,
              },
            ],
          },
        ],
      },
    },
  },
};

export const cloneDot = {
  type: CloneDotDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        dot_ids: [1],
        quantity: 2,
      },
    },
  },
};

export const updateDot = {
  type: UpdateDotDto,
  examples: {
    'Example 1': {
      value: {
        vendor_id: 2,
        area_id: 3,
        position_id: 7,
        position_name: 'Stage 2',
        priority: true,
        missing: false,
        location: {
          latitude: '38.8951',
          longitude: '-77.0364',
        },
        shifts: [
          {
            dot_shift_id: 261,
            rate: 10,
            shift_id: 61,
            staff: 4,
          },
          {
            dot_shift_id: 260,
            rate: 50,
            shift_id: 60,
            staff: 2,
          },
          {
            dot_shift_id: 259,
            rate: 30,
            shift_id: 62,
            staff: 1,
          },
          {
            rate: 60,
            shift_id: 59,
            staff: 2,
          },
        ],
      },
    },
  },
};

export const updateBulkDot = {
  type: UpdateBulkDotsDto,
  examples: {
    'Example 1': {
      value: {
        dot_ids: [1005, 1006],
        vendor_id: 1,
        position_id: 1,
        position_name: 'Event Manager',
        dates: ['2024-12-18', '2024-12-19'],
        shifts: [
          {
            rate: 60,
            shift_id: 1,
            staff: 1,
          },
        ],
      },
    },
  },
};

export const copyDot = {
  type: CopyDotDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        dates: ['2024-12-18', '2024-12-19'],
      },
    },
  },
};

export const swapDots = {
  type: SwapDotsDto,
  examples: {
    'Example 1': {
      value: {
        event_id: 2015,
        vendor_id: 1,
        dots: [
          {
            pos_id: 'PERM-001',
            vendor: 'CISS',
            position: 'Manager',
            position_name: 'Event Manager',
            area: 'Gate 1',
            priority: true,
            shifts: [
              {
                start_date: '2024-08-22T12:00:00Z',
                end_date: '2024-08-22T19:00:00Z',
                rate: 20,
                quantity: 2,
              },
            ],
          },
          {
            pos_id: 'PERM-002',
            vendor: 'CISS',
            position: 'Admin',
            position_name: 'Security office',
            area: 'Gate 2',
            priority: false,
            shifts: [
              {
                start_date: '2024-08-22T11:00:00Z',
                end_date: '2024-08-22T20:00:00Z',
                rate: 20,
                quantity: 1,
              },
            ],
          },
        ],
      },
    },
  },
};

export const resetDeploymentDto = {
  type: ResetDeploymentDto,
  examples: {
    'Example 1': {
      value: {
        event_id: 123,
      },
    },
    'Example 2': {
      value: {
        event_id: 123,
        vendor_id: 456,
      },
    },
  },
};
