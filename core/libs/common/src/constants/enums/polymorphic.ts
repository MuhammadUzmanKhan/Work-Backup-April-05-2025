export enum PolymorphicType {
  EVENT = 'Event',
  EVENT_SUBTASKS = 'EventSubtasks',
  INVENTORY = 'Inventory',
  CAD = 'Cad',
  EVENT_CAD = 'EventCad',
  USER = 'User',
  LOST_AND_FOUND = 'LostAndFound',
  INCIDENT = 'Incident',
  RESERVATION = 'Reservation',
  ROUTE = 'Route',
  COMPANY = 'Company',
  CAMPER = 'Camper',
  MESSAGE_GROUP = 'MessageGroup',
  INCIDENT_MESSAGE_CENTER = 'IncidentMessageCenter',
  DEPARTMENT = 'Department',
  INCIDENT_TYPE = 'IncidentType',
  INCIDENT_TYPE_TRANSLATION = 'IncidentTypeTranslation',
  SCAN = 'Scan',
  REFERENCE_MAP = 'ReferenceMap',
  TASK = 'Task',
  SUBTASK = 'Subtask',
  USER_COMPANY_ROLE = 'UserCompanyRole',
  DASHBOARD_EVENT = 'DashboardEvent',
  TASK_LIST = 'TaskList',
  PERSON_INVOLVED = 'PersonInvolved',
  INCIDENT_FORM = 'IncidentForm',
  EVENT_USER = 'EventUser',
  AUDIT = 'Audit',
  INCIDENT_ZONE = 'IncidentZone',
  EVENT_INCIDENTS = 'EventIncidents',
  GLOBAL_INCIDENT = 'GlobalIncident',
  LIVE_VIDEO = 'LiveVideo',
  LEGAL_GROUP = 'LegalGroup',
}

export enum CommentableTypes {
  USER = 'User',
  LOST_AND_FOUND = 'LostAndFound',
  INCIDENT = 'Incident',
  INVENTORY = 'Inventory',
  RESERVATION = 'Reservation',
  DAY = 'Day',
  EVENT = 'Event',
  TASK = 'Task',
  USER_COMPANY_ROLE = 'UserCompanyRole',
}

export enum MessageReceiverTypes {
  USER = 'User',
  DEPARTMENT = 'Department',
  CAMPER = 'Camper',
  RESERVATION = 'Reservation',
  VENDOR = 'Vendor',
  SHIFT = 'Shift',
  EVENT = 'Event',
  INCIDENT_MESSAGE_CENTER = 'IncidentMessageCenter',
  MESSAGE_GROUP = 'MessageGroup',
}

export enum AlertableType {
  PRIORITY_GUIDE = 'PriorityGuide',
  INCIDENT_TYPE = 'IncidentType',
  ALL = 'All',
}

export enum MessageGroupableType {
  EVENT = 'Event',
  DEPARTMENT = 'Department',
  ROUTE = 'Route',
  SHIFT = 'Shift',
  STAFF = 'Staff',
  INVENTORY_ZONE = 'InventoryZone',
  TICKET_TYPE = 'TicketType',
  RESERVATION_TYPE = 'ReservationType',
  CAMPER = 'Camper',
  INCIDENT_DIVISION = 'IncidentDivision',
}

export enum MessageableType {
  EVENT = 'Event',
  DEPARTMENT = 'Department',
  VIP_CAMPER = 'VipCamper',
  VENDOR = 'Vendor',
  INCIDENT = 'Incident',
  MESSAGE_GROUP = 'MessageGroup',
  INCIDENT_MESSAGE_CENTER = 'IncidentMessageCenter',
  CAMPER = 'Camper',
  SERVICE_REQUEST_TYPE = 'ServiceRequestType',
  USER = 'User',
  ROUTE = 'Route',
  RESERVATION = 'Reservation',
  MOBILE_INCIDENT_INBOX = 'MobileIncidentInbox',
  TASK = 'Task',
}

export enum PinableType {
  COMPANY = 'Company',
  EVENT = 'Event',
  MESSAGE_GROUP = 'MessageGroup',
  INVENTORY = 'Inventory',
  DASHBOARD_EVENT = 'DashboardEvent',
  TASK_LIST = 'TaskList',
}
