// for adding common attributes in Queries
export const eventAttributes = [
  'name',
  'logo',
  'url',
  'key_genre',
  'genre',
  'sub_genre',
  'about_event',
  'expected_attendance',
  'daily_attendance',
  'venue_name',
  'event_location',
  'short_event_location',
  'time_zone',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'public_start_date',
  'public_end_date',
  'public_start_time',
  'public_end_time',
  'demo_event',
  'request_status',
  'event_category',
  'dialer_layout',
  'dialer_dispatch_layout',
  'division_lock_service',
  'venue_id',
];

export const eventActiveModulesAttributes = [
  'transportation_future',
  'workforce_messaging',
  'vendor_future',
  'staff_future',
  'show_block',
  'service_request_future',
  'reservation_future',
  'messaging_capability',
  'message_service',
  'lost_and_found_future',
  'inventory_future',
  'incident_future',
  'incident_future_v2',
  'reporting_future',
  'dot_map_service_v2',
  'guest_messaging',
  'dot_map_service',
  'deposit_full_charges',
  'department_future',
  'camping_future',
  'task_future',
  'ticket_clear_template_future',
  'event_form_future',
  'audit_future',
  'active',
];

export const eventNamesAttributes = [
  'id',
  'name',
  'region_id',
  'incident_future',
  'incident_future_v2',
  'reporting_future',
  'dot_map_service_v2',
  'staff_future',
  'department_future',
  'vendor_future',
  'reservation_future',
  'camping_future',
  'inventory_future',
  'service_request_future',
  'transportation_future',
  'message_service',
  'dot_map_service',
  'task_future',
  'ticket_clear_template_future',
  'event_form_future',
  'audit_future',
];

export const eventDefaultTimes = {
  public_start_time: '00:00:00',
  start_time: '00:00:00',
  public_end_time: '23:59:00',
  end_time: '23:59:00',
};
