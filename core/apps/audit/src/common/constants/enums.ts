export enum AllShiftsSortingColumns {
  NAME = 'name',
  START_DATE = 'start_date',
  START_TIME = 'start_time',
  END_TIME = 'end_time',
  WORKERS = 'workers',
}

export enum StaffInShiftSortingColumns {
  VENDOR_NAME = 'vendor_name',
  POSITION = 'position',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  QR_CODE = 'qr_code',
}

export enum StaffSortingColumns {
  EXPECTED_START_DATE = 'expected_start_date',
  SHIFT_START = 'shift_start',
  SHIFT_END = 'shift_end',
}

export enum _UserAccess {
  // *** AUDIT MODULE *** //
  // Shift
  SHIFT_VIEW = 'shift:view',
  SHIFT_CREATE = 'shift:create',
  SHIFT_UPDATE = 'shift:update',
  SHIFT_DELETE = 'shift:delete',

  // Vendor
  VENDOR_VIEW = 'vendor:view',
  VENDOR_CREATE = 'vendor:create',

  // Vendor Position
  VENDOR_POSITION_VIEW = 'vendor_position:view',
  VENDOR_POSITION_CREATE = 'vendor_position:create',

  // Staff
  STAFF_VIEW = 'staff:view',
  STAFF_DOWNLOAD_CSV = 'staff:download_csv',
  STAFF_CREATE = 'staff:create',
  STAFF_UPLOAD_CSV = 'staff:upload_csv',
  STAFF_VIEW_STATS = 'staff:view_stats',
  STAFF_VIEW_POSITIONS_COUNT = 'staff:view_positions_count',
  STAFF_UPDATE_FLAG = 'staff:update_flag',
  STAFF_UPDATE_PRIORITY = 'staff:update_priority',
  STAFF_UPDATE_ALERT = 'staff:update_alert',
  STAFF_UPDATE_ATTENDANCE = 'staff:update_attendance',
  STAFF_DELETE = 'staff:delete',
  STAFF_DOWNLOAD_REPORT = 'staff:download_report',

  // Notes
  NOTE_VIEW = 'note:view',
  NOTE_CREATE = 'note:create',
}

export enum VendorTypes {
  DOT_MAP_VENDOR = 'DotMapVendor',
  TRANSPORTATION_VENDOR = 'TransportationVendor',
  AUDIT_VENDOR = 'AuditVendor',
}

export enum AttendanceStatus {
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
}
