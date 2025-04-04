export enum EventSortingColumns {
  NAME = 'name',
  SHORT_EVENT_LOCATION = 'short_event_location',
  VENUE_NAME = 'venue_name',
  START_DATE = 'start_date',
  TIME_ZONE = 'time_zone',
  STATUS = 'status',
  KEY_GENRE = 'key_genre',
  TOTAL_SUBTAKS = 'totalSubtasks',
  ROLE_NAME = 'role_name',
  COMPANY_NAME = 'company_name',
  UPDATED_AT = 'updated_at',
  PUBLIC_START_DATE = 'public_start_date',
  PUBLIC_END_DATE = 'public_end_date',
}

export enum WorkforceEventSortingColumns {
  NAME = 'name',
  vendors = 'vendors',
  uid = 'uid',
}

export enum ScanListSortingColumns {
  CREATED_AT = 'created_at',
  SCAN_TYPE = 'scan_type',
  ID = 'id',
  SCANNER_ID = 'scanner_id',
}

export enum InventorySortingColumns {
  ID = 'id',
  NAME = 'name',
  LOCATION_DESCRIPTION = 'location_description',
  DEPARTMENT_NAME = 'department_name',
  INVENTORY_TYPE_NAME = 'inventory_type_name',
  TIME_RECEIVED = 'time_received',
  TIME_DEPLOYED = 'time_deployed',
  TIME_RETURNED = 'time_returned',
  LAST_SCAN = 'last_scan',
}

export enum UsersSortingColumns {
  NAME = 'name',
  EMAIL = 'email',
  ROLE = 'role',
  DEPARTMENT = 'department_name',
  STATUS = 'status',
  DIVISION_NAME = 'division_name',
  COMPANY_NAME = 'company_name',
  CELL = 'cell',
  INCIDENT_ID = 'incident_id',
  SCAN_TYPE = 'scan_type',
  INCIDENT_TYPE = 'incident_type',
  CREATED_AT = 'created_at',
}

export enum UsersIncidentSortingColumns {
  NAME = 'name',
  EMAIL = 'email',
  DEPARTMENT = 'department_name',
  STATUS = 'status',
  CELL = 'cell',
  INCIDENT_ID = 'incident_id',
  SCAN_TYPE = 'scan_type',
  CREATED_AT = 'created_at',
  INCIDENT_TYPE = 'incident_type',
}

export enum DispatchUsersSortingColumns {
  NAME = 'name',
  STATUS = 'status',
  CREATED_AT = 'created_at',
}

export enum CompanySortingColumns {
  NAME = 'name',
  COUNTRY = 'country',
  PARENT_COMPANY = 'parentCompany',
  SUBCOMPANIES_COUNT = 'subcompaniesCount',
  TOTAL_EVENTS_COUNT = 'totalEventsCount',
  TOTOL_COUNT = 'totalCount',
}

export enum PointOfInterestSortingColumns {
  NAME = 'name',
  TYPE = 'type',
  ACTIVE = 'active',
  UPDATED_AT = 'updated_at',
}

export enum PointOfInterestTypeSortingColumns {
  NAME = 'name',
  UPDATED_AT = 'updated_at',
}

export enum EventSortingForMultipleStatus {
  NAME = 'name',
  SHORT_EVENT_LOCATION = 'short_event_location',
  VENUE_NAME = 'venue_name',
  STATUS = 'status',
  PUBLIC_START_DATE = 'public_start_date',
  PUBLIC_END_DATE = 'public_end_date',
}
