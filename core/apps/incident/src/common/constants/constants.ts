export enum IncidentZoneSortingColumns {
  NAME = 'name',
  UPDATED_AT = 'updated_at',
  INCIDENTS_COUNT = 'incidents_count',
  SUB_ZONE_COUNTS = 'incident_sub_zone_count',
}

export enum IncidentTypeSortingColumns {
  NAME = 'name',
  VARIABLE = 'variable',
}

export enum IncidentSubZoneSortingColumns {
  NAME = 'name',
  UPDATED_AT = 'updated_at',
  INCIDENTS_COUNT = 'incidents_count',
  PARENT_ZONE = 'parent_zone',
}

export enum IncidentCameraLocationSortingColumns {
  NAME = 'name',
  UPDATED_AT = 'updated_at',
}

export enum IncidentWorkforceSortingColumns {
  UPDATED_AT = 'updated_at',
  INCIDENT_COUNT = 'incidents_count',
}

export enum IncidentTypeEventContactNameSortingColumns {
  TITLE = 'title',
}

export enum IncidentTypeStaffNameSortingColumns {
  NAME = 'name',
}

export enum IncidentMessageCenterSortingColumns {
  NAME = 'name',
  PHONE = 'phone_number',
}

export enum GetAllPrioritySortingColumns {
  NAME = 'name',
  TITLE = 'title',
  EMAIL = 'email',
  CELL = 'cell',
}

export enum GetAllEventContactSortingColumns {
  CONTACT_NAME = 'contact_name',
  CONTACT_EMAIL = 'contact_email',
  CONTACT_PHONE = 'contact_phone',
  FIRST_NAME = 'first_name',
  NAME = 'name',
  TITLE = 'title',
  EMAIL = 'email',
  CELL = 'cell',
  COMPANY_NAME = 'company_name',
  ROLE = 'role',
}

export const PriorityGuideMessages = {
  LOW: 'No immediate resolution needed if there are other priorities. It does not threaten anyone’s health or safety. It does not threaten infrastructure use or performance.',
  MEDIUM:
    'No immediate resolution needed if there are higher priorities. It does not threaten anyone’s health or safety. Infrastructure use or performance may be involved so long it doesn’t affect a person’s safety.',
  HIGH: 'Immediate attention needed by a designated Event Manager. It may threaten a person’s health or safety if not immediately addressed.',
  CRITICAL:
    'Immediate attention required. Someone’s health or safety is at risk in a possibly life threatening situation. Key infrastructure is at risk with the possibility of mass casualty if not immediately addressed. Designated Event Directors should be notified.',
};

export enum ScanCountNote {
  CORRECTED = 'Corrected',
}

export enum OrderByGroup {
  PRIORITY = 'priority',
  STATUS = 'status',
  PRIORITY_CHRONOLOGICAL = 'priority_chronological',
  STATUS_CHRONOLOGICAL = 'status_chronological',
}

export enum SortColumn {
  ID = 'id',
  CREATED_AT = 'created_at',
  INCIDENT_DIVISIONS = 'incident_divisions',
  INCIDENT_TYPE = 'incident_type',
  INCIDENT_ZONE = 'incident_zone',
  DESCRIPTION = 'description',
  PRIORITY = 'priority',
  STATUS = 'status',
  USERS = 'users',
  EVENT_NAME = 'event_name',
  LEGAL_CHANGED_AT = 'legal_changed_at',
}

export enum ChangelogsSortColumn {
  CREATED_AT = 'created_at',
  EDITOR_NAME = 'editor_name',
}

export enum ChangelogsChangeColumn {
  STATUS = 'status',
}

export enum LiveVideoType {
  INCIDENT = 'Incident',
}

export enum LiveVideoMode {
  NOT_START = 'not_start',
  LIVE = 'live',
  PAST = 'past',
}

export enum LiveVideoModeEnum {
  NOT_START = 0,
  LIVE = 1,
  PAST = 2,
}

export enum LiveVideoStreamingRequest {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum LiveVideoStreamingRequestEnum {
  PENDING = 0,
  ACCEPTED = 1,
  REJECTED = 2,
}

export enum LiveVideoRoleNumber {
  ADMIN = 0,
  PUBLISHER = 1,
  SUBSCRIBER = 2,
}
export enum LiveVideoRole {
  ADMIN = 'admin',
  PUBLISHER = 'publisher',
  SUBSCRIBER = 'subscriber',
}

export enum CsvForLocation {
  MAIN_ZONE = 'Main Zone',
  SUB_ZONE = 'Sub Zone',
  CAMERA_ZONE = 'Camera Zone',
}

export enum ScanType {
  ARRIVED = 'arrived',
  AT_SCENE = 'at_scene',
  IN_ROUTE = 'in_route',
  RESPONDED = 'responding',
  DONE = 'done',
  DISPATCHED = 'dispatched',
}

export enum LiveVideoTokenRole {
  PUBLISHER = 'publisher',
  SUBSCRIBER = 'subscriber',
}

export enum SocketTypes {
  INCIDENT_TYPE = 'incidentType',
  INCIDENT_TYPE_VARIATION = 'incidentTypeVariation',
  SOURCE = 'source',
  REFRENCE_MAP = 'refrenceMap',
  ALERT = 'alert',
  PRIORITY_GUIDE = 'priorityGuide',
  INCIDENT_DIVISION = 'incidentDivision',
  INCIDENT_MESSAGE_CENTER = 'incidentMessageCenter',
  INCIDENT_MOBILE_INBOX = 'incidentMobileInbox',
  INCIDENT_ZONE = 'incidentZone',
  INCIDENT_MAIN_ZONE = 'incidentMainZone',
  INCIDENT_SUB_ZONE = 'incidentSubZone',
  INCIDENT_CAMERA_ZONE = 'incidentCameraZone',
  INCIDENT_PRESET_MESSAGING = 'incidentPresetMessaging',
  CONVERSATION = 'conversation',
  EVENT_CONTACT = 'event_contact',
  SCAN_COUNT = 'scan_count',
  EVENT_NOTE = 'event_note',
}

export enum PriorityGuide {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum MessageBodyHeading {
  DISPATCH = 'ONTRACK DISPATCH',
  INCIDENT_CREATE_UPDATE = 'ONTRACK ALERT',
  ONTRACK_DOWNGRADE_ALERT = 'ONTRACK DOWNGRADE ALERT',
}

export enum IncidentZoneColors {
  DEFAULT = '#6086ce',
}

export const userScanType = [37, 38, 40, 41, 42, 33];
