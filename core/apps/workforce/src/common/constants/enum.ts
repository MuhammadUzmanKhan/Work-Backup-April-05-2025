export enum ScheduleSortingColumns {
  NAME = 'name',
  SHIFT_START_TIME = 'shift_start_time',
  SHIFT_END_TIME = 'shift_end_time',
}

export enum RailsWebhookChannel {
  DEPARTMENT_UPDATE = 'department_updates',
  REMOVE_DEPARTMENT = 'remove_department',
  ASSIGN_DEPARTMENT = 'assign_department',
}

export enum SCAN_TYPE {
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
  IN_ROUTE = 41,
  RESPONDING = 42,
  DONE = 43,
}

export enum SCANS {
  RECEIVED = 'received',
  OUT_OF_SERVICE = 'out_of_service',
  ASSIGNED = 'assigned',
  AVAILABLE = 'available',
}

export enum SocketTypes {
  DEPARTMENT = 'department',
}
