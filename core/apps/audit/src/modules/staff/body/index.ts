import {
  CreateStaffDto,
  UploadCsvDto,
  RemoveBulkStaffDto,
  UpdateAttendanceMobileDto,
  ReuploadStaffDto,
  UpdateAttendanceDto,
  AddRemoveStaffDto,
  StaffIdsDto,
} from '../dto';

export const createStaff = {
  type: CreateStaffDto,
  examples: {
    Example1: {
      value: {
        rate: 10,
        vendor_id: 1117,
        vendor_position_id: 1,
        shift_id: 5,
      },
    },
    Example2: {
      value: {
        qr_code: 'QR6543RU',
        checked_in: '2024-01-22T12:00:00.000Z',
        checked_out: '2024-01-22T20:00:00.000Z',
        pos: 'VP-1',
        rate: 20,
        is_flagged: true,
        vendor_id: 1118,
        vendor_position_id: 14,
        shift_id: 8,
      },
    },
  },
};

export const uploadCsv = {
  type: UploadCsvDto,
  examples: {
    Example1: {
      value: {
        event_id: 2015,
        csv_data: [
          {
            start_date: '2024-02-22T12:00:00Z',
            end_date: '2024-02-22T19:00:00Z',
            recursive: ['2024-02-23', '2024-02-24'],
            staff: [
              {
                vendor: 'Vendor 1',
                position: 'Assistant Manager',
                rate: 10,
                first_name: 'John',
                last_name: 'Wick',
                cell: '4155551414',
                country_code: '+1',
                country_iso_code: 'us',
                contact_email: 'john@gmail.com',
              },
              {
                vendor: 'Vendor 2',
                position: 'Supervisor',
                rate: 15,
                first_name: 'John',
                last_name: 'Wick',
                cell: '4155551415',
                country_code: '+1',
                country_iso_code: 'us',
                contact_email: 'john@gmail.com',
              },
            ],
          },
          {
            start_date: '2024-02-22T14:00:00Z',
            end_date: '2024-02-22T23:00:00Z',
            staff: [
              {
                vendor: 'Vendor 3',
                position: 'Software Engineer',
                rate: 20,
                first_name: 'John',
                last_name: 'Wick',
                cell: '4155551416',
                country_code: '+1',
                country_iso_code: 'us',
                contact_email: 'john@gmail.com',
              },
            ],
          },
          {
            start_date: '2024-02-23T19:00:00Z',
            end_date: '2024-02-24T05:00:00Z',
            recursive: ['2024-02-24'],
            staff: [
              {
                vendor: 'Vendor 4',
                position: 'Manager',
                rate: 10,
                first_name: 'John',
                last_name: 'Wick',
                cell: '4155551417',
                country_code: '+1',
                country_iso_code: 'us',
                contact_email: 'john@gmail.com',
              },
            ],
          },
        ],
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/989c601710015516/audit-csv-sample.xlsx',
        file_name: 'audit-csv-sample.xlsx',
      },
    },
  },
};

export const reuploadCsv = {
  type: ReuploadStaffDto,
  examples: {
    Example1: {
      value: {
        event_id: 2015,
        vendor_id: 1144,
        csv_data: [
          {
            start_date: '2024-03-22T12:00:00Z',
            end_date: '2024-03-22T19:00:00Z',
            recursive: ['2024-03-23', '2024-03-24'],
            staff: [
              {
                position: 'Assistant Manager',
                rate: 10,
              },
              {
                position: 'Supervisor',
                rate: 15,
              },
            ],
          },
          {
            start_date: '2024-03-22T14:00:00Z',
            end_date: '2024-03-22T23:00:00Z',
            staff: [
              {
                position: 'Software Engineer',
                rate: 20,
              },
            ],
          },
          {
            start_date: '2024-03-23T19:00:00Z',
            end_date: '2024-03-24T05:00:00Z',
            recursive: ['2024-03-24'],
            staff: [
              {
                position: 'Manager',
                rate: 10,
              },
            ],
          },
        ],
        url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/989c601710015516/audit-csv-sample.xlsx',
        file_name: 'audit-csv-sample.xlsx',
      },
    },
  },
};

export const updateAttendance = {
  type: UpdateAttendanceDto,
  examples: {
    Example1: {
      value: {
        event_id: 2015,
        shift_align: false,
        qr_code: 'QR5555333',
      },
    },
  },
};

export const addRemoveStaff = {
  type: AddRemoveStaffDto,
  examples: {
    Example1: {
      value: {
        vendor_id: 1532,
        shift_id: 216,
        event_id: 2015,
        quantity: 10,
        rate: 20,
      },
    },
  },
};

export const removeBulkStaff = {
  type: RemoveBulkStaffDto,
  examples: {
    Example1: {
      value: {
        vendor_id: 1532,
        shift_id: 216,
        event_id: 2015,
      },
    },
  },
};

export const staffIds = {
  type: StaffIdsDto,
  examples: {
    Example1: {
      value: {
        staff_ids: [13120, 13121],
      },
    },
  },
};

export const updateAttendanceMobile = {
  type: UpdateAttendanceMobileDto,
  examples: {
    Example1: {
      value: {
        event_id: 2015,
        qr_code: 'QR444000RU',
        vendor_id: 1147,
        vendor_position_id: 1,
        shift_id: 62,
      },
    },
  },
};
