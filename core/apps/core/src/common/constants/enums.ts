export enum DATE_TYPE {
  pre_show_date = 'pre_show_date',
  post_show_date = 'post_show_date',
  show_date = 'show_date',
}

export enum REQUEST_STATUS {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  DENIED = 'denied',
}

export enum REQUEST_EVENT_TYPE {
  VENUES = 'venues',
  FESTIVALS = 'festivals',
}

export enum COMPANY_CATEGORY {
  venues = 'Venue',
  festivals = 'Festival',
}

export enum CompanyCategoryType {
  VENUES = 'venues',
  FESTIVALS = 'festivals',
  STANDARD = 'standard',
}

export enum CompanyCreateCategoryType {
  STANDARD = 'standard',
}

export enum EventRequestSortingColumns {
  NAME = 'name',
  CREATED_AT = 'created_at',
  PUBLIC_START_DATE = 'public_start_date',
  PUBLIC_END_DATE = 'public_end_date',
}

export enum PermissionModules {
  EVENT = 'event',
  COMPANY = 'company',
  USER_COMPANY = 'user_company',
  TASK = 'task',
  TASK_CATEGORY = 'task_category',
  TASK_LIST = 'task_list',
  TASK_SUBTASK = 'task_subtask',
  INCIDENT = 'incident',
  INCIDENT_TYPE = 'incident_type',
  INCIDENT_DIVISION = 'incident_division',
  INCIDENT_ZONE = 'incident_zone',
  SOURCE = 'source',
  PRIORITY_GUIDE = 'priority_guide',
  ALERT = 'alert',
  FILTER = 'filter',
  FUEL_TYPE = 'fuel_type',
  INCIDENT_MESSAGE_CENTER = 'incident_message_center',
  MOBILE_INCIDENT_INBOX = 'mobile_incident_inbox',
  PRESET_MESSAGE = 'preset_message',
  REFERENCE_MAP = 'reference_map',
  SCAN = 'scan',
  DEPARTMENT = 'department',
  INVENTORY = 'inventory',
  INVENTORY_TYPE = 'inventory_type',
  INVENTORY_TYPE_CATEGORY = 'inventory_type_category',
  INVENTORY_ZONE = 'inventory_zone',
  POINT_OF_INTEREST = 'point_of_interest',
  POINT_OF_INTEREST_TYPE = 'point_of_interest_type',
  SCHEDULING = 'scheduling',
  USER = 'user',
  DASHBOARD = 'dashboard',
  EVENT_CONTACT = 'event_contact',
  RESOLVED_INCIDENT_NOTE = 'resolved_incident_note',
  SHIFT = 'shift',
  VENDOR = 'vendor',
  VENDOR_POSITION = 'vendor_position',
  STAFF = 'staff',
  CAMERA_ZONE = 'camera_zone',
  COMMENT = 'comment',
  DAY = 'day',
  EVENT_NOTE = 'event_note',
  LIVE_VIDEO = 'live_video',
  MESSAGE = 'message',
  SCAN_COUNT = 'scan_count',
  CAD = 'cad',
  CAD_TYPE = 'cad_type',
  LEGAL_CHAT = 'legal_chat',
  PRESET = 'preset',
}

export enum PermissionSortingColumns {
  NAME = 'name',
  TYPE = 'type',
  ROLE_COUNT = 'role_count',
}

export enum RoleSortingColumns {
  NAME = 'name',
  USER_COUNT = 'user_count',
  PERMISSION_COUNT = 'permission_count',
}

export enum PermissionType {
  SYSTEM = 'system',
  CUSTOM = 'custom',
}

export enum TemplateType {
  EVENT = 'Event',
}

export enum UserCompanyEventSortingColumn {
  NAME = 'name',
  VENUE_NAME = 'venue_name',
  START_DATE = 'start_date',
  ROLE_NAME = 'role_name',
  COMPANY_NAME = 'company_name',
}

export enum RailsWebhookChannel {
  UPDATE_USER = 'update_user',
  UPLOAD_STAFF = 'upload_staff',
}

/**
 * Currently this enum contains only those modules for which we need to add counts in event listing.
 * We will add other modules as there will be need to show counts for those modules as well.
 */
export enum EventModuleFuture {
  TASK_FUTURE = 'task_future',
  INCIDENT_FUTURE = 'incident_future',
}

export enum SocketTypes {
  USER = 'user',
  DELETE_CAD = 'delete_cad',
}

export enum UserTemperatureFormat {
  Fahrenheit = 'F',
  Celsius = 'C',
}

export enum UserDateFormat {
  'MM/DD/YY' = 'MM/DD/YY',
  'DD/MM/YY' = 'DD/MM/YY',
  'MM/DD/YYYY' = 'MM/DD/YYYY',
  'DD/MM/YYYY' = 'DD/MM/YYYY',
}

export enum UserTimeFormat {
  '12 HOUR' = '12 hour',
  '24 HOUR' = '24 hour',
}
