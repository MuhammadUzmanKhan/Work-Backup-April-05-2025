export enum DashboardTopFilter {
  PARENT = 'Parent', // Universal view
  CHILD = 'Child', // Universal view
  EVENT = 'Event', // In all views
  GLOBAL = 'Global', // Global view
}

export enum IncidentStatusDashboardType {
  OPEN = 'open',
  DISPATCHED = 'dispatched', // incidents other 4 statuses are covered under dispatched.
  FOLLOW_UP = 'follow_up',
  RESOLVED = 'resolved',
}

export enum PriorityDashboardType {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentSortingColumns {
  ID = 'id',
  CREATED_AT = 'created_at',
  TYPE = 'incident_type',
  EVENT = 'event_name',
  COMPANY = 'company_name',
  STATUS = 'status',
  RESOLUTION_TIME = 'resolution_time',
}

export enum StatusChangesType {
  RESERVATION = 'Reservation',
  LOST_AND_FOUND = 'LostAndFound',
  SERVICE_REQUEST = 'ServiceRequest',
  INCIDENT = 'Incident',
  DEPOSIT = 'Deposit',
  RESERVATION_DAMAGE = 'ReservationDamage',
}

export enum LiveEventListingColumns {
  NAME = 'name',
  SHORT_EVENT_LOCATION = 'short_event_location',
  START_DATE = 'start_date',
  START_TIME = 'start_time',
}

export enum PinnedEventsIncidentsListingColumns {
  ID = 'id',
  event_name = 'event_name',
  INCIDENT_ZONE_NAME = 'incident_zone_name',
  INCIDENT_DIVISION_NAME = 'incident_division_name',
  CREATED_AT = 'created_at',
  LOGGED_DATE_TIME = 'logged_date_time',
  INCIDENT_TYPE = 'incident_type',
  STATUS = 'status',
  PRIORITY = 'priority',
  DESCRIPTION = 'description',
  DISPATCH_USER = 'dispatch_user',
}

export enum AnalyticsFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum WeekDays {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum MonthDays {
  FIRST_DAY_OF_MONTH = 'first_day_of_month',
  LAST_DAY_OF_MONTH = 'last_day_of_month',
}
