export * from './polymorphic';
export * from './roles';
export * from './sorting';
export * from './status-priority';
export * from './csv-pdf';

export enum InfoType {
  AGENCY_INFORMATION = 'agency_information',
  KEY_CONTACT = 'key_contact',
}

export enum DateType {
  PRE_SHOW_DATE = 'pre_show_date',
  POST_SHOW_DATE = 'post_show_date',
  SHOW_DATE = 'show_date',
}

export enum EventType {
  EVENT = 'event',
  DOT_MAP = 'dot_map',
}

export enum EventCadType {
  CAD_FILE_1 = 'cad_file_1',
  CAD_FILE_2 = 'cad_file_2',
}

export enum EventGenre {
  FESTIVAL = 'Festival',
  EDM = 'EDM',
  HIP_HOP_AND_RAP = 'Hip-Hop & Rap',
  POP = 'Pop',
  ROCK = 'Rock',
  METAL = 'Metal',
  LATIN = 'Latin',
  COUNTRY = 'Country',
  R_AND_B = 'R&B',
  JAZZ = 'Jazz',
  OTHER = 'Other',
}

export enum SortBy {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum MessageTypesIndexes {
  SENT = 0,
  RECEIVED = 1,
}

export enum MessageTypes {
  SENT = 'sent',
  RECEIVED = 'received',
}

export enum PusherChannels {
  EVENTS_CHANNEL = 'private-events-channel',
  EVENT_COMMENTS_CHANNEL = 'private-events-comments-channel',
  EVENT_CHANGELOG_CHANNEL = 'private-events-changelog-channel',
  EVENT_ATTACHMENT_CHANNEL = 'private-events-attachment-channel',
  EVENT_SUBTASK_ATTACHMENT_CHANNEL = 'private-events-subtask-attachment-channel',
  EVENT_MESSAGE_UPDATES = 'private-event-message-updates',
  TASKS_CHANNEL = 'private-tasks-channel',
  TASKS_CATEGORY_CHANNEL = 'private-tasks-category-channel',
  TASKS_CHANNEL_V1 = 'private-tasks-channel-v1',
  TASK_COMMENTS_CHANNEL = 'private-tasks-comments-channel',
  TASK_CHANGELOG_CHANNEL = 'private-tasks-changelog-channel',
  TASK_ATTACHMENT_CHANNEL = 'private-tasks-attachment-channel',
  TASK_LIST_CHANNEL = 'private-task-list-channel',
  USER_COMPANY_ROLE_CHANGELOG_CHANNEL = 'private-user-company-role-changelog-channel',
  USER_COMPANY_ROLE_COMMENTS_CHANNEL = 'private-user-company-role-comments-channel',
  DASHBOARD_CHANNEL = 'private-dashboard-channel',
  INCIDENT_CHANNEL = 'private-incident-channel',
  PRESENCE_INCIDENT_LEGAL = 'presence-incident-legal',
  CAD_CHANNEL = 'private-cads-channel',
  CAD_TYPE_CHANNEL = 'private-cad-types-channel',
  INCIDENT_COMMENTS_CHANNEL = 'private-incident-comments-channel',
  INCIDENT_CHANGELOG_CHANNEL = 'private-incident-changelog-channel',
  INCIDENT_ATTACHMENT_CHANNEL = 'private-incident-attachment-channel',
  UNASSIGN_EVENT_USER_CHANNEL = 'private-unassign-event-user-channel',
  AUDIT_CHANNEL = 'private-audit-channel',
  USER_STATUS = 'private-user-status-channel',
  LIVE_VIDEO_CHANNEL = 'private-live-video-channel',
  WEATHER_CHANNEL = 'private-weather-channel',
  USER_INCIDENT_DIVISIONS_CHANNEL = 'private-user-incident-divisions-channel',
  COMPANY_CHANGELOG_CHANNEL = 'private-company-chnagelog-channel',
  USER_CHANGELOG_CHANNEL = 'private-user-changelog-channel',
  INCIDENT_TYPE_CHANGELOG_CHANNEL = 'private-incident-type-changelog-channel',
  INCIDENT_TYPE_TRANSLATION_CHANGELOG_CHANNEL = 'private-incident-type-translation-changelog-channel',
  DOTMAP_CHANNEL = 'private-dotmap-channel',
  USER_CHANNEL = 'private-user-channel',
  COMPANY_CHANNEL = 'private-company-channel',
  PRESENCE_INCIDENT_LISTING = 'presence-incident-listing',
  GLOBAL_INCIDENT_CHANNEL = 'private-global-incident-channel',
  PRESENCE_TASKS_CHANNEL_V1 = 'presence-tasks-channel-v1',
  NOTFICATION_CHANNEL = 'private-notification-channel',
  LOCATION_CHANNEL = 'private-location-channel',
  SCAN_COUNT = 'private-scan-count',
  EVENT_NOTE = 'private-event_note',
}

export enum PusherEvents {
  ALL = 'all',
  DEPARTMENTS = 'departments',
  EVENT_CONVERSATION_MESSAGE_UPDATES = 'event-conversation-message-updates',
  EVENT_SENT_MESSAGES_UPDATES = 'event-sent-messages-updates',
  EVENT_STAFF_MESSAGES_UPDATES = 'event-staff-messages-updates',
  EVENT_STAFF_COMMENTS_UPDATES = 'event-staff-comments-updates',
  USER = 'user',
  INCIDENT_DIVISION = 'incident-division',
  INCIDENT_TYPE = 'incident-type',
  ASSOCIATE_DEPARTMENTS = 'associate-departments',
  DISASSOCIATE_DEPARTMENTS = 'disassociate-department',
  DISASSOCIATE_INCIDENT_DIVISION = 'disassociate-incident-division',
  ASSOCIATE_INCIDENT_DIVISION = 'associate-incident-division',
  USER_CHANNEL_UPLOAD_CSV = 'user-channel-upload-csv',
  TASK_CHANNEL_UPLOAD_CSV = 'task-channel-upload-csv',
  ASSIGN_STAFF_TO_DEPARTMENT_AND_DIVISION = 'assign-staff-to-department-and-division',
  MESSAGE = 'message',
  TASK_CHANNEL_COUNTS = 'task-channel-counts',
  MULTIPLE_TASKS = 'multiple-tasks',
  EVENT = 'event',
  COMPANY = 'company',
  INCIDENT = 'incident',
  INCIDENT_LEGAL = 'incident-legal',
  INCIDENT_LEGAL_CHAT = 'incident-legal-chat',
  INCIDENT_LEGAL_CHAT_COUNT = 'incident-legal-chat-count',
  INCIDENT_LEGAL_GROUP = 'incident-legal-group',
  INCIDENT_LEGAL_COUNT = 'incident-legal-count',
  INCIDENT_COUNT = 'incident-count',
  INCIDENT_DISPATCH_LOGS = 'incident-dispatch-logs',
  INCIDENT_LINKED = 'incident-linked',
  PINNED_EVENT_INCIDENT = 'pinned_event_incident',
  PINNED_EVENT_DATA = 'pinned_event_data',
  RESOLVED_INCIDENT_NOTE = 'resolved-incident-note',
  DELETE_EVENT = 'delete-event',
  NEW_CREATED_EVENT = 'new-created-event',
  REQUESTED_EVENT_COUNT = 'requested-event-count',
  REQUEST_DENIED_EVENT = 'requested-denied-event',
  AUDIT_STAFF_UPDATE = 'audit-staff-update',
  AUDIT_STAFF_BULK_UPDATE = 'audit-staff-bulk-update',
  AUDIT_STAFF_UPLOAD_CSV = 'audit-staff-upload-csv',
  AUDIT_STAFF_DATA = 'audit-staff-data',
  AUDIT_STAFF_NOTES = 'audit-staff-notes',
  AUDIT_STAFF_BULK_DATA = 'audit-staff-bulk-data',
  AUDIT_STAFF_ASSETS = 'audit-staff-assets',
  AUDIT_STAFF_CLEAR = 'audit-staff-clear',
  MODULE_COUNT = 'module-count',
  AUDIT_STAFF_DATA_BY_DATE = 'audit-staff-data-by-date',
  USER_STATUS_UPDATE = 'user-status-update',
  AUDIT_STAFF_ORDER_DELIVER = 'audit-staff-order-deliver',
  LIVE_VIDEO_UPDATE = 'live-video-update',
  INCIDENT_ZONE = 'incident-zone',
  WEATHER_PROVIDER_UPDATE = 'weather-provider-update',
  COMPANY_WEATHER_PROVIDER_UPDATE = 'company-weather-provider-update',
  USER_INCIDENT_DIVISIONS = 'user-incident-divisions',
  USERS_INCIDENT_DIVISIONS = 'users-incident-divisions',
  INCIDENT_DASHBOARD_OVERVIEW = 'incident-dashboard-overview',
  INCIDENT_SETUP = 'incident-setup',
  INCIDENT_DASHBOARD_LISTS = 'incident-dashboard-lists',
  INCIDENT_TYPE_VARIATION_SETUP = 'incident-type-variation-setup',
  INCIDENT_TYPE_ASSOCIATION = 'incident-type-association',
  INCIDENT_DIVISION_ASSOCIATION = 'incident-division-association',
  EVENT_UPLOAD = 'event-upload',
  INCIDENT_MOBILE_INBOX = 'incident-mobile-inbox',
  INCIDENT_MESSAGE_CENTER = 'incident-message-center',
  INCIDENT_PRESET_MESSAGE = 'incident-preset-message',
  INCIDENT_MESSAGE = 'incident-message',
  LINK_UNLINK_INCIDENTS = 'link-unlink-incidents',
  EVENT_CONTACT = 'event-contact',
  DOT = 'dot',
  DOT_RESET = 'dot-reset',
  DOT_COUNT = 'dot-count',
  COPY_DOT = 'copy-dot',
  VENDOR = 'vendor',
  BUDGET_SUMMARY = 'budget-summary',
  CAD = 'cad',
  CAD_TYPE = 'cad-type',
  GLOBAL_INCIDENT_EVENT = 'global-incident-event',
  TASK = 'tasks',
  NOTIFICATION = 'notifications',
  USER_LOCATION = 'user-location',
}

export enum Permissions {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  GLOBAL_ADMIN = 'global_admin',
  ONTRACK_MANAGER = 'ontrack_manager',
  GLOBAL_MANAGER = 'global_manager',
}

export enum ActiveModulesPermissions {
  INCIDENT_FUTURE = 'Incidents',
  DOT_MAP_SERVICE = 'Dot Map System',
  CAMPING_FUTURE = 'Camping Management',
  TRANSPORTATION_FUTURE = 'Transportation',
  INVENTORY_FUTURE = 'Asset Management',
  SERVICE_REQUEST_FUTURE = 'Services Management',
  STAFF_FUTURE = 'Workforce',
  MESSAGE_SERVICE = 'Messaging System',
}

export enum MessageType {
  CUSTOM = 0,
  DEPARTMENT = 1,
  INVENTORY_ZONE = 2,
  RESERVATION_TYPE = 3,
  DIVISION = 4,
}

export enum ContactType {
  SECONDARY_CONTACT = 'SECONDARY',
  PRIMARY_CONTACT = 'PRIMARY',
  LEGAL_CONTACT = 'LEGAL',
}

export enum BullQueues {
  EVENT = 'Event',
  REPORTING = 'Reporting',
  NOTIFICATION = 'Notification',
}

export enum BullProcesses {
  EVENT_IN_PROGRESS = 'event_in_progress',
  EVENT_COMPLETED = 'event_completed',
  UPDATE_STATUS = 'update_status',
  REPORTING_SCHEDULE = 'reporting_schedule',
  SEND_EMAIL_OR_SCHEDULE = 'send_email_or_schedule',
  SEND_EVENT_PLAN_NOTIFICATION = 'send_event_plan_notification',
  DELETE_NOTIFICATION = 'delete_notification',
}

export enum OptInOptions {
  START = 'start',
  UNSTOP = 'unstop',
}

export enum OptOutOptions {
  STOP = 'stop',
  STOPALL = 'stopall',
  STOP_ALL = 'stop all',
  UNSUBSCRIBE = 'unsubscribe',
  CANCEL = 'cancel',
  END = 'end',
  QUIT = 'quit',
}

export enum InventoryTypeImage {
  HAS_IMAGE = 'has_image',
}

export enum ImageOrComment {
  HAS_IMAGE = 'has_image',
  HAS_COMMENT = 'has_comment',
  HAS_BOTH = 'has_both',
}

export enum ScanType {
  RECEIVED = 'received',
  OUT_OF_SERVICE = 'out_of_service',
  ASSIGNED = 'assigned',
  RETURNED = 'returned',
  FUEL = 'fuel',
  AVAILABLE = 'available',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  ASSOCIATED = 'associated',
  DISASSOCIATED = 'disassociated',
  YARD_ARRIVAL = 'yard_arrival',
  ORIENTATION = 'orientation',
  DRY_RUN = 'dry_run',
  DRIVER_BRIEFING = 'driver_briefing',
  HOTEL_DESK = 'hotel_desk',
  YARD_IN = 'yard_in',
  YARD_OUT = 'yard_out',
  PICK_UP_ARRIVAL = 'pick_up_arrival',
  PICK_UP_PAX = 'pick_up_pax',
  DROP_UNLOAD = 'drop_unload',
  VENUE_LOAD_OUT = 'venue_load_out',
  VENUE_STAGING = 'venue_staging',
  BREAK_IN = 'break_in',
  BREAK_OUT = 'break_out',
  OUT_OF_SERVICE_MECHANICAL = 'out_of_service_mechanical',
  OUT_OF_SERVICE_EMERGENCY = 'out_of_service_emergency',
  END_SHIFT = 'end_shift',
  PASSENGER = 'passenger',
  OTHER = 'other',
  GEO_ENTER = 'geo_enter',
  GEO_EXIT = 'geo_exit',
  NO_SHOW = 'no_show',
  CAMPER_CHECKED_OUT = 'camper_checked_out',
  ARRIVED = 'arrived',
  OCCUPIED = 'occupied',
  HOLD = 'hold',
  RESERVED = 'reserved',
  DISPATCHED = 'dispatched',
  AT_SCENE = 'at_scene',
  UNAVAILABLE = 'unavailable',
  IN_ROUTE = 'in_route',
  RESPONDING = 'responding',
  DONE = 'done',
}

export enum ScanTypeNumber {
  RECEIVED = 0,
  OUT_OF_SERVICE = 1,
  ASSIGNED = 2,
  RETURNED = 3,
  FUEL = 4,
  AVAILABLE = 5,
  CHECKED_IN = 6,
  CHECKED_OUT = 7,
  ASSOCIATED = 8,
  DISASSOCIATED = 9,
  YARD_ARRIVAL = 10,
  ORIENTATION = 11,
  DRY_RUN = 12,
  DRIVER_BRIEFING = 13,
  HOTEL_DESK = 14,
  YARD_IN = 15,
  YARD_OUT = 16,
  PICK_UP_ARRIVAL = 17,
  PICK_UP_PAX = 18,
  DROP_UNLOAD = 19,
  VENUE_LOAD_OUT = 20,
  VENUE_STAGING = 21,
  BREAK_IN = 22,
  BREAK_OUT = 23,
  OUT_OF_SERVICE_MECHANICAL = 24,
  OUT_OF_SERVICE_EMERGENCY = 25,
  END_SHIFT = 26,
  PASSENGER = 27,
  OTHER = 28,
  GEO_ENTER = 29,
  GEO_EXIT = 30,
  NO_SHOW = 31,
  CAMPER_CHECKED_OUT = 32,
  ARRIVED = 33,
  OCCUPIED = 34,
  HOLD = 35,
  RESERVED = 36,
  DISPATCHED = 37,
  AT_SCENE = 38,
  UNAVAILABLE = 39,
  IN_ROUTE = 40,
  RESPONDING = 41,
  DONE = 42,
}

export enum SourceType {
  FE = 'fe',
  MOBILE = 'mobile',
  ATTENDEE = 'attendee',
}

export enum SourceTypeNumber {
  FE = 0,
  MOBILE = 1,
  ATTENDEE = 2,
}

export enum IncidentDispatch {
  DISPATCHED = 'dispatched',
  NOT_DISPATCHED = 'not_dispatched',
}

export enum MessageTypeInMessages {
  SENT = 'sent',
  RECEIVED = 'received',
}

export enum IncidentFormType {
  MEDICAL = 'medical',
  SECURITY = 'security',
  EJECTION = 'ejection',
}

export enum IncidentFormReportType {
  MEDICAL_TYPE = 0,
  VEHICLE_TYPE = 1,
}

export enum MedicalTreatment {
  DECLINED = 0,
  NO = 1,
  YES = 2,
}

export enum IncidentFormSourceType {
  MOBILE = 'mobile',
  WEB = 'web',
}

export enum ImageType {
  ID_PROOF = 0,
  INCIDENT = 1,
  PERSON_SIGNATURE = 2,
  REPORTER_SIGNATURE = 3,
  INCIDENT_AREA = 4,
}

export enum EjectionReasonType {
  FIGHT = 'Fight',
  ASSAULT = 'Assault',
  CODE_OF_CONDUCT_VIOLATION = 'Code of Conduct Violation',
  INTOXICATION = 'Intoxication',
  THEFT = 'Theft',
  PROPERTY_DAMAGE = 'Property Damage',
  TRESPASSING = 'Trespassing',
  OTHER = 'Other',
}

export enum ShiftTimesScanType {
  YARD_ARRIVAL = 'yard_arrival',
  DRIVER_CHECK_IN = 'driver_check_in',
  ORIENTATION = 'orientation',
  DRY_RUN = 'dry_run',
  DRIVER_BRIEFING = 'driver_briefing',
  HOTEL_DESK = 'hotel_desk',
  YARD_IN = 'yard_in',
  YARD_OUT = 'yard_out',
  PICK_UP_ARRIVAL = 'pick_up_arrival',
  PICK_UP_PAX = 'pick_up_pax',
  DROP_UNLOAD = 'drop_unload',
  VENUE_LOAD_OUT = 'venue_load_out',
  VENUE_STAGING = 'venue_staging',
  BREAK_IN = 'break_in',
  BREAK_OUT = 'break_out',
  OUT_OF_SERVICE_MECHANICAL = 'out_of_service_mechanical',
  OUT_OF_SERVICE_EMERGENCY = 'out_of_service_emergency',
  END_SHIFT = 'end_shift',
  PASSENGER = 'passenger',
}

export enum ReservationStatisticType {
  ARRIVED_RESERVATIONS = 'arrived_reservations',
  ARRIVED_CAMPERS = 'arrived_campers',
  ASSIGNED_RESERVATIONS = 'assigned_reservations',
  CAMPER_CHECKED_OUT_RESERVATIONS = 'camper_checked_out_reservations',
  CHECKED_IN_CAMPERS = 'checked_in_campers',
  CHECKED_IN_RESERVATIONS = 'checked_in_reservations',
  CHECKED_OUT_RESERVATIONS = 'checked_out_reservations',
  DEPOSITS = 'deposits',
  OCCUPIED_RESERVATIONS = 'occupied_reservations',
}

export enum RidershipType {
  INGRESS = 'ingress',
  EGRESS = 'egress',
}

export enum StaffRoles {
  'SUPER_ADMIN' = 0,
  'ADMIN' = 1,
  'DRIVER' = 2,
  'MANAGER' = 3,
  'CRAIGS_STAGING' = 10,
  'SCANNER' = 13,
  'VENDOR' = 14,
  'CAMPING_ADMIN' = 15,
  'CAMPING_MANAGER' = 16,
  'VENDOR_STAFF' = 18,
  'TRANSPORT_MANAGER' = 19,
  'TRANSPORT_DISPATCHER' = 20,
  'CAMPING_DISPATCHER' = 21,
  'INCIDENT_MANAGER' = 22,
  'INCIDENT_DISPATCHER' = 23,
  'SERVICE_MANAGER' = 24,
  'SERVICE_DISPATCHER' = 25,
  'GLOBAL_ADMIN' = 26,
  'GLOBAL_MANAGER' = 27,
  'ONTRACK_MANAGER' = 28,
  'WORKFORCE_MANAGER' = 29,
  'OPERATIONS_MANAGER' = 30,
  'CAMERA_VENDOR' = 31,
  'REGIONAL_MANAGER' = 32,
  'REGIONAL_ADMIN' = 33,
}

export enum VisibleStatus {
  HIDE = 'hide',
  SHOW = 'show',
}
export enum StatusChangeStatusType {
  OCCUPIED = 'occupied',
  ASSIGNED = 'assigned',
  ARRIVED = 'arrived',
}

export enum ReservationStatisticColumns {
  ASSIGNED = 'assigned',
  ARRIVED = 'arrived',
}

export enum DashboardScope {
  UNIVERSAL = 'universal',
  GLOBAL = 'global',
  ADMIN = 'admin',
}

export enum Continents {
  NORTH_AMERICA = 'North America',
  SOUTH_AMERICA = 'South America',
  EUROPE = 'Europe',
  ASIA = 'Asia',
  AFRICA = 'Africa',
  AUSTRALIA = 'Australia',
  ANTARCTICA = 'Antarctica',
}

export enum COMMUNICATIONS_CLIENT {
  ANALYTICS = 'ontrack-analytics',
  COMMUNICATION = 'ontrack-communication',
  CORE = 'ontrack-core',
  WORKFORCE = 'ontrack-workforce',
  INCIDENT = 'ontrack-incident',
  KAFKA = 'kafka',
  REPORTING = 'reporting',
}

export enum ResolvedIncidentNoteStatusDb {
  ARREST = 0,
  EVICTION_EJECTION = 1,
  HOSPITAL_TRANSPORT = 2,
  TREATED_AND_RELEASED = 3,
  RESOLVED_NOTE = 4,
}

export enum ResolvedIncidentNoteStatusApi {
  ARREST = 'arrest',
  EVICTION_EJECTION = 'eviction_ejection',
  HOSPITAL_TRANSPORT = 'hospital_transport',
  TREATED_AND_RELEASED = 'treated_and_released',
  RESOLVED = 'resolved_note',
}

export enum Gender {
  FEMALE = 0,
  MALE = 1,
  OTHER = 2,
  PREFER_NOT_TO_SAY = 3,
}

export enum SubcompanyCategoryType {
  VENUES = 'venues',
  FESTIVALS = 'festivals',
  DEMO = 'demo',
  STANDARD = 'standard',
}

export enum TemplateType {
  EVENT = 'Event',
}

export enum REQUEST_EVENT_TYPE {
  VENUES = 'venues',
  FESTIVALS = 'festivals',
}

export enum IosInterruptionLevel {
  CRITICAL = 'critical',
  TIME_SENSITIVE = 'time_sensitive',
}

export enum TemplateNames {
  NEW_EVENT = 'new-event',
  UPLOAD_CAD = 'upload-cad',
  UPDATE_REQUEST_EVENT = 'update-request-event',
  EVENT_REQUEST = 'event-request',
  PUBLIC_CONTACT_PAGE = 'public-contact-page',
  INCIDENT_ALERT = 'incident-alert',
  USER_UPLOAD = 'user-upload',
  REQUEST_INCIDENT_TYPE = 'request-incident-type',
  REPORTING = 'reporting',
  TASK_ASSIGNED = 'task-assigned',
  TASK_COMMENT_MENTION = 'task-comment-mention',
  EVENT_COMMENT_MENTION = 'event-comment-mention',
  LEGAL_PRIVILEGE = 'legal-privilege',
  LEGAL_CHAT = 'legal-chat',
}

export enum TranslationLanguages {
  DA = 'da',
  DE = 'de',
  EN = 'en',
  ES = 'es',
  FI = 'fi',
  FR = 'fr',
  IT = 'it',
  JA = 'ja',
  NL_BE = 'nl-BE',
  NL_NL = 'nl-NL',
  NO = 'no',
  PT = 'pt',
  SV = 'sv',
}

export enum SocketTypesStatus {
  CREATE = 'create',
  UPDATE = 'update',
  BULK_UPDATE = 'bulk-update',
  CLONE = 'clone',
  DELETE = 'delete',
  BULK_DELETE = 'bulk-delete',
  UPLOAD = 'upload',
}

export enum LegalGroupStatusEnum {
  ARCHIVED = 'archived',
  CONCLUDED = 'concluded',
  REOPENED = 'reopened',
}

export enum ChatTypeEnum {
  MESSAGE = 'message',
  CHANGELOG = 'changelog',
}

export enum LanguageEnum {
  DA = 'da',
  DE = 'de',
  EN = 'en',
  ES = 'es',
  FI = 'fi',
  FR = 'fr',
  IT = 'it',
  JA = 'ja',
  NL_BE = 'nl-BE',
  NL_NL = 'nl-NL',
  NO = 'no',
  PT = 'pt',
  SV = 'sv',
}

export enum MODULE_NAMES {
  ANALYTICS = 'analytics',
  REPORTING = 'reporting',
}
