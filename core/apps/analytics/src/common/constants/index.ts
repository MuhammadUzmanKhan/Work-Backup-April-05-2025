export * from './responses';
export * from './enums';
export * from './interfaces';

/**
 * These 2 incident types are used as test type in staging db. And may be in other dbs as well.
 * But name doesn't define if incident type is a testing type or not
 * but there is a column isTest in incident type table that shows if type in testing or not.
 */
export const TEST_INCIDENT_TYPES = ['[Test - Type]', '[Test Incident]'];

export const X_API_KEY = {
  name: 'x-api-key',
  required: true,
  schema: {
    type: 'string',
  },
};

export const X_API_SECRET = {
  name: 'x-api-secret',
  required: true,
  schema: {
    type: 'string',
  },
};

export const LINE_CHART_VALUES = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
  '11:00 PM',
  '12:00 AM',
  '01:00 AM',
  '02:00 AM',
  '03:00 AM',
  '04:00 AM',
  '05:00 AM',
];
