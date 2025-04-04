import { CreateTemporaryEventDto } from '@Modules/event/dto/temporary-queue.dto';
import {
  CreateEventDto,
  PreEventChecklistPdfDto,
  DosChecklistPdfDto,
} from '../dto';

export const createTemporaryEventQueue = {
  type: CreateTemporaryEventDto,
  examples: {
    Example: {
      value: {},
    },
  },
};

export const createRequestEvent = {
  type: CreateEventDto,
  examples: {
    Example: {
      value: {
        name: 'Request Event',
        about_event:
          'Sunt suscipit quia rerum amet ullam expedita suscipit dolor quasi nobis molestiae qui possimus',
        time_zone: 'Europe/London',
        url: 'https://www.cipyjabaju.com.au',
        start_date: '2023-10-18',
        end_date: '2023-10-30',
        public_start_date: '2023-10-18',
        public_end_date: '2023-10-30',
        event_location: 'Abbey Rd., London, UK',
        staff_future: true,
        department_future: false,
        vendor_future: false,
        task_future: true,
        reservation_future: false,
        camping_future: true,
        inventory_future: true,
        service_request_future: true,
        incident_future: true,
        incident_future_v2: false,
        reporting_future: false,
        dot_map_service_v2: false,
        transportation_future: true,
        message_service: true,
        ticket_clear_template_future: true,
        event_form_future: false,
        vehicle_count: '0',
        lost_and_found_future: false,
        audit_future: false,
        total_hours: '0',
        hourly_rate: '0',
        location: {
          top_left: {
            latitude: '51.5370938',
            longitude: '-0.1833814',
          },
          top_right: {
            latitude: '51.5370938',
            longitude: '-0.1833814',
          },
          bottom_left: {
            latitude: '51.5370938',
            longitude: '-0.1833814',
          },
          bottom_right: {
            latitude: '51.5370938',
            longitude: '-0.1833814',
          },
          center: {
            latitude: '51.5370938',
            longitude: '-0.1833814',
          },
        },
        venue_name: 'Nomlanga Kerr',
        expected_attendance: 34,
        daily_attendance: 22,
        start_time: '00:30',
        end_time: '00:30',
        public_start_time: '00:30',
        public_end_time: '00:30',
        logo: null,
        key_genre: 'EDM',
        genre: null,
        sub_genre: null,
        dot_map_service: true,
        demo_event: false,
        status: 'upcoming',
        event_cads: [
          {
            url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/stage/e0c1651721303942/Screenshot%202024-07-18%20at%204.55.29%C3%A2%C2%80%C2%AFPM.png',
            name: 'Cad 1',
          },
        ],
      },
    },
  },
};

export const preEventChecklistPdf = {
  type: PreEventChecklistPdfDto,
  examples: {
    Example: {
      value: {
        dispatch_center: {
          enter_incident_division: false,
          enter_incident_type: true,
          enter_incident_location: false,
          add_description: false,
          dispatch_unit: false,
          status_of_incident: false,
          add_comment: false,
          add_event_note: false,
          add_scan_count: false,
          check_map_view: false,
          change_division_dropdown: false,
          change_department_dropdown: false,
          search_box: false,
        },
        incident_zone: {
          main_zone: false,
          sub_zone: false,
          change_color: true,
          map_zoom_in_and_out: false,
          drop_zone: false,
          zone_detail: false,
          list_view_and_rename: false,
          list_view_find_zone: false,
          delete_zone: false,
          street_view: false,
          satellite_view: false,
        },
        incident_dashboard: {
          change_date_incident_range: false,
          check_filter_incident_overview: false,
          move_around_map: false,
          use_dropdown: false,
          street_view: false,
          satellite_view: false,
          view_staff: false,
          change_department: false,
          search_staff: false,
          toggle_incident: false,
        },
        incident_module_setup: {
          check_uncheck_source: false,
          select_unselect_all: false,
          create_source_and_division: false,
          check_search: false,
          delete_source_and_division: false,
          edit_source_and_division: false,
          click_incident_zone: false,
          incident_module_alert: false,
        },
        workforce_staff: {
          click_department: false,
          search_box: false,
          change_Division_dropdown: false,
          change_department_dropdown: false,
          add_new_staff: false,
          add_existing_staff: false,
          add_department: false,
          correct_popup_appear: false,
          edit_message_map: false,
          popup_display: false,
        },
      },
    },
  },
};

export const dayOfShowChecklistPdf = {
  type: DosChecklistPdfDto,
  examples: {
    Example: {
      value: {
        devices: {
          all_devices: false,
          all_command: true,
          all_web_users: false,
          the_onTrack: false,
          field_devices: false,
          all_field: false,
        },
        setup: {
          staff_logins: false,
          incident_module_setup: false,
          incident_zones: false,
        },
        dispatch_center: {
          create_an_incident: false,
          cycle_incidents: false,
          test_dispatching: true,
          check_map_view: false,
          test_messaging: false,
        },
        incidents_dashboard: {
          test_gps: false,
          tracked_field: true,
        },
        other_modules: {
          messaging_center: false,
        },
      },
    },
  },
};
