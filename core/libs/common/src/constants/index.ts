import {
  IncidentPriority,
  PriorityFilter,
  RolesNumberEnum,
  _FormattedRolesEnum,
} from './enums';
import * as dotenv from 'dotenv';

dotenv.config();

export * from './countries';
export * from './responses';
export * from './enums';
export * from './interfaces';
export * from './types';
export * from './user-access';
export * from './roles-conditions';
export * from './global-notification-settings';

export const ROLES = [
  'super_admin',
  'admin',
  'driver',
  'manager',
  'scanner',
  'vendor',
  'camping_admin',
  'camping_manager',
  'vendor_staff',
  'transport_manager',
  'transport_dispatcher',
  'camping_dispatcher',
  'incident_manager',
  'incident_dispatcher',
  'service_manager',
  'service_dispatcher',
  'global_admin',
  'global_manager',
  'ontrack_manager',
  'workforce_manager',
  'operations_manager',
  'camera_vendor',
  'regional_manager',
  'regional_admin',
  'task_admin',
  'legal_admin',
  'dotmap_admin',
];

export const MESSAGE_SETTING_TYPE = [
  'FindMyTent',
  'ServiceRequestForOpen',
  'ServiceRequestForClose',
  'AssignInventoryToReservation',
  'IncidentNotification',
];

export const SCANS_NOT_TO_ESTMATE = [
  'received',
  'out_of_service',
  'assigned',
  'returned',
  'fuel',
  'available',
  'checked_out',
  'associated',
  'disassociated',
  'driver_briefing',
  'hotel_desk',
];

export const ESTIMATE_FOR = [
  'out_of_service_mechanical',
  'out_of_service_emergency',
];

export const UPLOAD_FILE_LIMIT = 104857600; //100MB

export const rails_webhook_url = `${process.env['RAILS_BASE_URL']}/webhooks`;

export const MILLI_SECONDS_TWENTY_FOUR_HOURS = 86400000; //24hrs in milliseconds

export const MILLI_SECONDS_FORTY_EIGHT_HOURS: number =
  MILLI_SECONDS_TWENTY_FOUR_HOURS * 2; // 48 hours in milliseconds

export const INCIDENT_DESCRIPTION_FOR_SCAN =
  'Driver has been out of service at location http://maps.google.com/?q=';

export const COMPANY_ID_API_HEADER = {
  name: 'Company-Id',
  required: false,
  schema: {
    type: 'string',
  },
  description: `It should be empty in case of Super Admin Or OnTrack Manager. But for other roles, it shouldn't be empty`,
};

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

const includedRoles = [
  0, 1, 2, 3, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  29, 30, 31, 32, 33, 34, 35, 36, 37,
];

export const roleMapping = includedRoles
  .map((roleId) => `WHEN ${roleId} THEN '${_FormattedRolesEnum[roleId]}'`)
  .join('\n');

export const _roleMapping = includedRoles
  .map(
    (roleId) =>
      `WHEN ${roleId} THEN '${RolesNumberEnum[roleId]?.toLowerCase()}'`,
  )
  .join('\n');

export const incidentStatusMap = {
  0: 'Open',
  1: 'Dispatched',
  7: 'Responding',
  6: 'On Scene',
  5: 'Transport',
  3: 'Arrival',
  4: 'Follow Up',
  2: 'Resolved',
};

export const priorityMap: { [key: number]: string } = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Critical',
};

export const customPriorityMap: Record<PriorityFilter, IncidentPriority> = {
  [PriorityFilter.NORMAL]: IncidentPriority.MEDIUM,
  [PriorityFilter.IMPORTANT]: IncidentPriority.HIGH,
  [PriorityFilter.LOW]: IncidentPriority.LOW,
  [PriorityFilter.CRITICAL]: IncidentPriority.CRITICAL,
};

export const resolvedIncidentNoteStatusDbMap = {
  0: 'Arrest',
  1: 'Eviction/Ejection',
  2: 'Hospital Transport',
  3: 'Treated and Released',
  4: 'Resolved',
};

export const incidentStatusMapNumberToString = {
  0: 'open',
  1: 'dispatched',
  7: 'responding',
  6: 'at_scene',
  5: 'in_route',
  3: 'archived',
  4: 'follow_up',
  2: 'resolved',
};

export const priorityMapNumberToString = {
  0: 'low',
  1: 'medium',
  2: 'high',
  3: 'critical',
};

export const resolvedStatusMapNumberToString = {
  0: 'arrest',
  1: 'eviction_ejection',
  2: 'hospital_transport',
  3: 'treated_and_released',
  4: 'resolved_note',
};

export const PriorityFilterBothConventionNumber = {
  LOW: 0,
  NORMAL: 1,
  MEDIUM: 1,
  IMPORTANT: 2,
  HIGH: 2,
  CRITICAL: 3,
};
