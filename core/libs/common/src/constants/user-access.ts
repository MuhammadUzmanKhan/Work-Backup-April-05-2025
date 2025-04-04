export enum UserAccess {
  // *** CORE MODULE *** //
  // Events
  EVENT_ALL = 'event:all',
  EVENT_VIEW = 'event:view',
  EVENT_CREATE = 'event:create',
  EVENT_UPDATE = 'event:update',
  EVENT_ARCHIVE = 'event:archive',
  EVENT_ADD_FILES = 'event:add_files',
  EVENT_CREATE_TASK = 'event:create_task',
  EVENT_UPDATE_TASK = 'event:update_task',
  EVENT_DELETE_TASK = 'event:delete_task',
  EVENT_VIEW_TASK = 'event:view_task',
  EVENT_UPDATE_STATUS = 'event:update_status',
  EVENT_UPLOAD_ATTACHMENT = 'event:upload_attachment',
  EVENT_VIEW_ATTACHMENT = 'event:view_attachment',
  EVENT_DELETE_ATTACHMENT = 'event:delete_attachment',
  EVENT_ADD_COMMENT = 'event:add_comment',
  EVENT_VIEW_CHANGE_LOGS_AND_COMMENTS = 'event:view_change_logs_and_comments',
  EVENT_UPDATE_TASK_STATUS = 'event:update_task_status',
  EVENT_UPLOAD_TASK_ATTACHMENT = 'event:upload_task_attachment',
  EVENT_DELETE_TASK_ATTACHMENT = 'event:delete_task_attachment',
  EVENT_CAD_CREATE = 'event:cad_create',
  EVENT_CAD_VIEW = 'event:cad_view',
  EVENT_CAD_UPDATE = 'event:cad_update',
  EVENT_CAD_CURRENT_VERSION_UPDATE = 'event:cad_current_version_update',
  EVENT_VIEW_REQUESTED = 'event:view_requested',
  EVENT_UPDATE_REQUEST_STATUS = 'event:update_request_status',
  EVENT_CREATE_REQUESTED = 'event:create_requested',
  EVENT_PIN = 'event:pin',
  EVENT_USER_COMPANY_EVENTS = 'event:user_company_events',
  EVENT_VIEW_USER_ASSIGNED_EVENTS = 'event:view_user_assigned_events',
  EVENT_DOWNLOAD_CSV_PDF = 'event:download_csv_pdf',
  EVENT_CLONE_EVENT = 'event:clone_event',
  EVENT_UPLOAD = 'event:upload',
  EVENT_IMPORT = 'event:import',
  EVENT_RESTRICT_ACCESS = 'event:restrict_access',
  EVENT_DIVISION_LOCK = 'event:division_lock',

  // Cads
  CAD_CREATE = 'cad:create',
  CAD_VIEW = 'cad:view',
  CAD_UPDATE = 'cad:update',
  CAD_DELETE = 'cad:delete',

  // Cads Types
  CAD_TYPE_CREATE = 'cad_type:create',
  CAD_TYPE_VIEW = 'cad_type:view',
  CAD_TYPE_UPDATE = 'cad_type:update',
  CAD_TYPE_DELETE = 'cad_type:delete',

  // Global Incident Actions
  GLOBAL_INCIDENT_CREATE = 'global_incident:create',
  GLOBAL_INCIDENT_VIEW_ALL = 'global_incident:view_all',
  GLOBAL_INCIDENT_UPDATE = 'global_incident:update',

  // Companies
  COMPANY_ALL = 'company:all',
  COMPANY_VIEW = 'company:view',
  COMPANY_CREATE = 'company:create',
  COMPANY_UPDATE = 'company:update',
  COMPANY_ARCHIVE = 'company:archive',
  COMPANY_VIEW_PARENTS = 'company:view_parents',
  COMPANY_VIEW_CHILDS = 'company:view_childs',
  COMPANY_VIEW_CHILDS_WITH_EVENTS = 'company:view_childs_with_events',
  COMPANY_VIEW_CHILDS_BY_COMPANY_ID = 'company:view_childs_by_company_id',
  COMPANY_VIEW_ALL = 'company:view_all',
  COMPANY_NAMES = 'company:names',
  COMPANY_CHANGE_LOG = 'company:view_change_log',

  // *** LEGAL MODULE *** //
  LEGAL_CHAT_SEND_MESSAGE = 'legal_chat:send_message',
  LEGAL_CHAT_VIEW_MESSAGES = 'legal_chat:view_messages',
  LEGAL_CHAT_STATUS_UPDATE = 'legal_chat:update_status',
  LEGAL_CHAT_CHANGELOGS = 'legal_chat:view_changelog',

  // Universal Staff Listing (User Companies)
  USER_COMPANY_CREATE = 'user_company:create',
  USER_COMPANY_ADD_COMMENT = 'user_company:add_comment',
  USER_COMPANY_VIEW_ALL = 'user_company:view_all',
  USER_COMPANY_VIEW_CHANGE_LOGS = 'user_company:view_change_logs',
  USER_COMPANY_VIEW_COMMENTS = 'user_company:view_comments',
  USER_COMPANY_UPDATE = 'user_company:update',
  USER_COMPANY_BLOCK = 'user_company:block',
  USER_COMPANY_DELETE = 'user_company:delete',

  // Roles And Pemrission Module
  ROLE_PERMISSION_CREATE_ROLE = 'role_permission:create_role',
  ROLE_PERMISSION_CREATE_PERMISSION = 'role_permission:create_permission',
  ROLE_PERMISSION_MANAGE_PERMISSIONS = 'role_permission:manage_permissions',
  ROLE_PERMISSION_VIEW_ROLES = 'role_permission:view_roles',
  ROLE_PERMISSION_VIEW_PERMISSIONS = 'role_permission:view_permissions',
  ROLE_PERMISSION_VIEW_PERMISSION_MODULES = 'role_permission:view_permission_modules',
  ROLE_PERMISSION_UPDATE_ROLE = 'role_permission:update_role',
  ROLE_PERMISSION_UPDATE_PERMISSION = 'role_permission:update_permission',

  // Ticket Clear Module
  TICKET_CLEAR_CREATE = 'ticket_clear:create',
  TICKET_CLEAR_UPDATE = 'ticket_clear:update',
  TICKET_CLEAR_DELETE = 'ticket_clear:delete',

  // Template Module
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_VIEW = 'template:view',
  TEMPLATE_UPDATE = 'template:update',
  TEMPLATE_DELETE = 'template:delete',

  // Comments Module
  COMMENT_ADD_COMMENT = 'comment:add_comment',
  COMMENT_VIEW_COMMENTS = 'comment:view_comments',
  COMMENT_UPDATE = 'comment:update',

  // *** TASK MODULE *** //
  // Tasks
  TASK_CREATE = 'task:create',
  TASK_CREATE_MULTIPLE = 'task:create_multiple',
  TASK_ADD_COMMENT = 'task:add_comment',
  TASK_UPLOAD_ATTACHMENT = 'task:upload_attachment',
  TASK_VIEW = 'task:view',
  TASK_CHANGE_LOGS = 'task:change_logs',
  TASK_COMMENTS = 'task:comments',
  TASK_UPDATE = 'task:update',
  TASK_PRIORITY = 'task:priority',
  TASK_ASSIGNEE = 'task:assignee',
  TASK_PIN = 'task:pin',
  TASK_DELETE = 'task:delete',
  TASK_REMOVE_ASSIGNEE = 'task:remove_assignee',
  TASK_REMOVE_ATTACHMENT = 'task:remove_attachment',
  TASK_CLONE = 'task:clone',
  TASK_UPDATE_STATUS = 'task:update_status',
  TASK_UPDATE_DIVISION = 'task:update_division',
  TASK_UPDATE_LOCATION = 'task:update_location',
  TASK_EXPORT_CSV_PDF = 'task:export_csv_pdf',
  TASK_UPDATE_NAME = 'task:update_name',
  TASK_UPDATE_DESCRIPTION = 'task:update_description',
  TASK_MAKE_STANDALONE = 'task:make_standalone',
  TASK_LINK_TO_LIST = 'task:link_to_list',
  TASK_FLAG = 'task:flag',
  TASK_MAKE_RECURRING = 'task:make_recurring',

  // Task Categories
  TASK_CATEGORY_CREATE = 'task_category:create',
  TASK_CATEGORY_VIEW = 'task_category:view',
  TASK_CATEGORY_UPDATE = 'task_category:update',
  TASK_CATEGORY_DELETE = 'task_category:delete',

  // Task Lists
  TASK_LIST_CREATE = 'task_list:create',
  TASK_LIST_VIEW_TASKS = 'task_list:view_tasks',
  TASK_LIST_NAMES = 'task_list:names',
  TASK_LIST_UPDATE = 'task_list:update',
  TASK_LIST_MULTIPLE_UPDATE = 'task_list:multiple_update',
  TASK_LIST_DELETE = 'task_list:delete',
  TASK_LIST_PIN = 'task_list:pin',
  TASK_LIST_LOCK_DIVISIONS = 'task_list:lock_divisions',
  TASK_LIST_LOCK_DATES = 'task_list:lock_dates',
  TASK_LIST_MAKE_LIST_PRIVATE = 'task_list:make_list_private',

  // Task Subtasks
  TASK_SUBTASK_CREATE = 'task_subtask:create',
  TASK_SUBTASK_UPLOAD_ATTACHMENT = 'task_subtask:upload_attachment',
  TASK_SUBTASK_VIEW_ALL = 'task_subtask:view_all',
  TASK_SUBTASK_VIEW = 'task_subtask:view',
  TASK_SUBTASK_UPDATE = 'task_subtask:update',
  TASK_SUBTASK_STATUS_CHANGE = 'task_subtask:status_change',
  TASK_SUBTASK_DELETE = 'task_subtask:delete',
  TASK_SUBTASK_REMOVE_ATTACHMENT = 'task_subtask:remove_attachment',

  // *** INCIDENT MODULE *** //
  // Incident
  INCIDENT_VIEW_ALL = 'incident:view_all',
  INCIDENT_CREATE = 'incident:create',
  INCIDENT_UPDATE = 'incident:update',
  INCIDENT_UPDATE_LEGAL_STATUS = 'incident:update_legal_status',
  INCIDENT_UPDATE_STATUS = 'incident:update_status',
  INCIDENT_UPDATE_PRIORITY = 'incident:update_priority',
  INCIDENT_UPDATE_INCIDENT_DIVISION = 'incident:update_incident_division',
  INCIDENT_UPDATE_INCIDENT_TYPE = 'incident:update_incident_type',
  INCIDENT_UPDATE_INCIDENT_ZONE = 'incident:update_incident_zone',
  INCIDENT_UPDATE_SOURCE = 'incident:update_source',
  INCIDENT_UPDATE_LOCATION = 'incident:update_location',
  INCIDENT_UPDATE_DESCRIPTION = 'incident:update_description',
  INCIDENT_UPDATE_REPORTER = 'incident:update_reporter',
  INCIDENT_UPDATE_NOTE = 'incident:update_note',
  INCIDENT_UPDATE_RESOLVED_STATUS = 'incident:update_resolved_status',
  INCIDENT_CLONE = 'incident:clone',
  INCIDENT_VIEW = 'incident:view',
  INCIDENT_ADD_COMMENT = 'incident:add_comment',
  INCIDENT_UPDATE_COMMENT = 'incident:update_comment',
  INCIDENT_UPLOAD_IMAGE = 'incident:upload_image',
  INCIDENT_VIEW_LINKED_INCIDENTS = 'incident:view_linked_incidents',
  INCIDENT_VIEW_OVERVIEW_STATS = 'incident:view_overview_stats',
  INCIDENT_VIEW_CHANGE_LOGS = 'incident:view_change_logs',
  INCIDENT_VIEW_COMMENTS = 'incident:view_comments',
  INCIDENT_VIEW_DISPATCH_LOGS = 'incident:view_dispatch_logs',
  INCIDENT_VIEW_LEGAL_LOGS = 'incident:view_legal_logs',
  INCIDENT_DETAIL_PDF = 'incident:detail_pdf',
  INCIDENT_DASHBOARD_PDF = 'incident:dashboard_pdf',
  INCIDENT_DISPATCH_STAFF = 'incident:disptach_staff',
  INCIDENT_LINK_INCIDENT = 'incident:link_incident',
  INCIDENT_UNLINK_INCIDENT = 'incident:unlink_incident',
  INCIDENT_UNLINK_DISPATCHED_USER = 'incident:unlink_dispatched_user',
  INCIDENT_VIEW_IMAGES = 'incident:view_images',
  INCIDENT_REMOVE_IMAGE = 'incident:remove_image',
  INCIDENT_DOWNLOAD_CSV = 'incident:download_csv',
  INCIDENT_MAP_VIEW = 'incident:map_view',
  INCIDENT_VIEW_STAFF = 'incident:view_staff',
  INCIDENT_VIEW_CAMERAS = 'incident:view_cameras',
  INCIDENT_VIEW_LIVE = 'incident:view_live',
  INCIDENT_UPLOAD = 'incident:upload',
  INCIDENT_UPDATE_DIALER_LAYOUT = 'incident:update_dialer_layout',

  // Incident Type
  INCIDENT_TYPE_CREATE = 'incident_type:create',
  INCIDENT_TYPE_AVAILABLE_AND_ASSIGNED = 'incident_type:available_and_assigned',
  INCIDENT_TYPE_UPDATE = 'incident_type:update',
  INCIDENT_TYPE_DELETE = 'incident_type:delete',
  INCIDENT_TYPE_VIEW_ALL = 'incident_type:view_all',
  INCIDENT_TYPE_VIEW = 'incident_type:view',
  INCIDENT_TYPE_REMOVE_ALERTS = 'incident_type:remove_alerts',
  INCIDENT_TYPE_CLONE = 'incident_type:clone',
  INCIDENT_TYPE_MANAGE = 'incident_type:manage',
  INCIDENT_TYPE_PIN = 'incident_type:pin',
  INCIDENT_TYPE_REQUEST = 'incident_type:request',
  INCIDENT_TYPE_DOWNLOAD_CSV = 'incident_type:download_csv',
  INCIDENT_TYPE_DOWNLOAD_PDF = 'incident_type:download_pdf',

  // Incident Type Management
  INCIDENT_TYPE_MANAGEMENT_CREATE = 'incident_type_management:create',
  INCIDENT_TYPE_MANAGEMENT_UPDATE = 'incident_type_management:update',
  INCIDENT_TYPE_MANAGEMENT_VIEW_VARIATION = 'incident_type_management:view_variation',
  INCIDENT_TYPE_MANAGEMENT_CHANGE_LOG = 'incident_type_management:view_change_log',

  // Incident Division
  INCIDENT_DIVISION_ASSOCIATE_TO_EVENT = 'incident_division:associate_to_event',
  INCIDENT_DIVISION_CREATE = 'incident_division:create',
  INCIDENT_DIVISION_DISASSOCIATE_FROM_EVENT = 'incident_division:disassociate_from_event',
  INCIDENT_DIVISION_AVAILABLE_AND_ASSIGNED = 'incident_division:available_and_assigned',
  INCIDENT_DIVISION_UPDATE = 'incident_division:update',
  INCIDENT_DIVISION_DELETE = 'incident_division:delete',
  INCIDENT_DIVISION_VIEW_ALL = 'incident_division:view_all',
  INCIDENT_DIVISION_VIEW = 'incident_division:view',
  INCIDENT_DIVISION_CLONE = 'incident_divsion:clone',
  INCIDENT_DIVISION_DOWNLOAD_CSV = 'incident_divsion:download_csv',
  INCIDENT_DIVISION_DOWNLOAD_PDF = 'incident_divsion:download_pdf',

  // Incident Zone
  INCIDENT_ZONE_VIEW_ALL = 'incident_zone:view_all',
  INCIDENT_ZONE_CLONE = 'incident_zone:clone',
  INCIDENT_ZONE_CREATE = 'incident_zone:create',
  INCIDENT_ZONE_VIEW = 'incident_zone:view',
  INCIDENT_ZONE_COUNT = 'incident_zone:count',
  INCIDENT_ZONE_UPDATE = 'incident_zone:update',
  INCIDENT_ZONE_DELETE = 'incident_zone:delete',
  INCIDENT_ZONE_DOWNLOAD_CSV = 'incident_zone:download_csv',
  INCIDENT_ZONE_DOWNLOAD_PDF = 'incident_zone:download_pdf',

  // Source
  SOURCE_CREATE = 'source:create',
  SOURCE_UPDATE = 'source:update',
  SOURCE_DELETE = 'source:delete',
  SOURCE_VIEW_ALL = 'source:view_all',
  SOURCE_VIEW = 'source:view',
  SOURCE_CLONE = 'source:clone',
  SOURCE_MANAGE = 'source:manage',
  SOURCE_UPLOAD = 'source:upload',

  // Camera Zone
  CAMERA_ZONE_CREATE = 'camera_zone:create',
  CAMERA_ZONE_VIEW = 'camera_zone:view',
  CAMERA_ZONE_VIEW_ALL = 'camera_zone:view_all',
  CAMERA_ZONE_UPDATE = 'camera_zone:update',
  CAMERA_ZONE_DELETE = 'camera_zone:delete',

  // Priority Guuide
  PRIORITY_GUIDE_UPDATE = 'priority_guide:update',
  PRIORITY_GUIDE_VIEW = 'priority_guide:view',
  PRIORITY_GUIDE_VIEW_ALL = 'priority_guide:view_all',
  PRIORITY_GUIDE_CLONE = 'priority_guide:clone',

  // Days
  DAY_VIEW_ALL = 'day:view_all',

  // Alert
  ALERT_CREATE = 'alert:create',
  ALERT_CREATE_MULTIPLE = 'alert:create_multiple',
  ALERT_VIEW_ALL_AVAILABLE_KEY_CONTACTS = 'alert:view_all_available_key_contacts',
  ALERT_VIEW_ALL_AVAILABLE_STAFF_USER = 'alert:view_all_available_staff_user',
  ALERT_UPDATE = 'alert:update',
  ALERT_DELETE = 'alert:delete',
  ALERT_CLONE = 'alert:clone',
  ALERT_COUNT = 'alert:count',

  // Event Notes
  EVENT_NOTE_CREATE = 'event_note:create',
  EVENT_NOTE_VIEW = 'event_note:view',
  EVENT_NOTE_DAYS = 'event_note:days',
  EVENT_NOTE_UPDATE = 'event_note:update',
  EVENT_NOTE_DOWNLOAD_PDF = 'event_note:download_pdf',

  // Filter
  FILTER_VIEW_ALL = 'filter:view_all',

  // Fuel Type
  FUEL_TYPE_VIEW_ALL = 'fuel_type:view_all',

  // Incident Message Center
  INCIDENT_MESSAGE_CENTER_CREATE = 'incident_message_center:create',
  INCIDENT_MESSAGE_VIEW_ALL = 'incident_message_center:view_all',
  INCIDENT_MESSAGE_VIEW = 'incident_message_center:view',
  INCIDENT_MESSAGE_CENTER_UPDATE = 'incident_message_center:update',
  INCIDENT_MESSAGE_CENTER_DELETE = 'incident_message_center:delete',
  INCIDENT_MESSAGE_CENTER_CLONE = 'incident_message_center:clone',
  INCIDENT_MESSAGE_CENTER_SNOOZE = 'incident_message_center:snooze',
  INCIDENT_MESSAGE_CENTER_SNOOZE_UNREAD_COUNT = 'incident_message_center:unread_count',

  // Mobile Incident Inbox
  MOBILE_INCIDENT_INBOX_CREATE = 'mobile_incident_inbox:create',
  MOBILE_INCIDENT_INBOX_VIEW_ALL = 'mobile_incident_inbox:view_all',
  MOBILE_INCIDENT_INBOX_VIEW = 'mobile_incident_inbox:view',
  MOBILE_INCIDENT_INBOX_UPDATE = 'mobile_incident_inbox:update',
  MOBILE_INCIDENT_INBOX_DELETE = 'mobile_incident_inbox:delete',
  MOBILE_INCIDENT_INBOX_CLONE = 'mobile_incident_inbox:clone',

  // Reporting Preset
  PRESET_CREATE = 'preset:create',
  PRESET_VIEW = 'preset:view',
  PRESET_UPDATE = 'preset:update',
  PRESET_DELETE = 'preset:delete',
  PRESET_PIN = 'preset:pin',
  PRESET_SEND_EMAIL = 'preset:send_email',

  // Preset Message
  PRESET_MESSAGE_CREATE = 'preset_message:create',
  PRESET_MESSAGE_VIEW_ALL = 'preset_message:view_all',
  PRESET_MESSAGE_VIEW = 'preset_message:view',
  PRESET_MESSAGE_UPDATE = 'preset_message:update',
  PRESET_MESSAGE_DELETE = 'preset_message:delete',
  PRESET_MESSAGE_CLONE = 'preset_message:clone',

  // Analytics Preset
  PRESET_ANALYTICS_CREATE = 'preset_analytics:create',

  // Reference Map
  REFERENCE_MAP_CREATE = 'reference_map:create',
  REFERENCE_MAP_VIEW_ALL = 'reference_map:view_all',
  REFERENCE_MAP_VIEW = 'reference_map:view',
  REFERENCE_MAP_UPDATE = 'reference_map:update',
  REFERENCE_MAP_DELETE = 'reference_map:delete',
  REFERENCE_MAP_CLONE = 'reference_map:clone',
  REFERENCE_MAP_DOWNLOAD_PDF = 'reference_map:download_pdf',

  // Scan
  SCAN_TYPES = 'scan:types',
  SCAN_VIEW = 'scan:view',
  SCAN_CREATE = 'scan:create',
  SCAN_ENABLE = 'scan:enable',

  // Scan Count
  SCAN_COUNT_CREATE = 'scan_count:create',
  SCAN_COUNT_VIEW = 'scan_count:view',
  SCAN_COUNT_UPDATE = 'scan_count:update',
  SCAN_COUNT_DAYS = 'scan_count:days',
  SCAN_COUNT_DOWNLOAD_CSV = 'scan_count:download_csv',

  // Incident Form
  INCIDENT_FORM_VIEW = 'incident_form:view',

  // Live Video
  LIVE_VIDEO_CREATE = 'live_video:create',
  LIVE_VIDEO_GENERATE_TOKEN = 'live_video:generate_token',
  LIVE_VIDEO_VIEW_ALL = 'live_video:view_all',
  LIVE_VIDEO_VIEW = 'live_video:view',
  LIVE_VIDEO_UPDATE = 'live_video:update',
  LIVE_VIDEO_DELETE = 'live_video:delete',

  // *** WORKFORCE MODULE *** //
  // Department
  DEPARTMENT_CREATE = 'department:create',
  DEPARTMENT_DISASSOCIATE_FROM_EVENT = 'department:disassociate_from_event',
  DEPARTMENT_ASSIGN_TO_EVENT = 'department:assign_to_event',
  DEPARTMENT_VIEW_ALL = 'department:view_all',
  DEPARTMENT_AVAILABLE_AND_ASSIGNED = 'department:available_and_assigned',
  DEPARTMENT_NAMES = 'department:names',
  DEPARTMENT_VIEW = 'department:view',
  DEPARTMENT_UPDATE = 'department:update',
  DEPARTMENT_CLONE = 'department:clone',

  // Inventory
  INVENTORY_ASSOCIATE_USER = 'inventory:associate_user',
  INVENTORY_DISASSOCIATE_USER = 'inventory:disassociate_user',
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_VIEW_ALL = 'inventory:view_all',
  INVENTORY_VIEW_ALL_BY_INVENTORY_TYPE = 'inventory:view_all_by_inventory_type',
  INVENTORY_VIEW_BY_STATS = 'inventory:view_by_stats',
  INVENTORY_INVENTORY_TYPES = 'inventory:view_inventory_types',
  INVENTORY_UPDATE_STATUS = 'inventory:update_status',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_UPLOAD_ATTACHMENT = 'inventory:upload_attachment',

  // Inventory Type
  INVENTORY_TYPE_VIEW_ALL = 'inventory_type:view_all',
  INVENTORY_TYPE_AVAILABLE_AND_ASSIGNED = 'inventory_type:available_and_assigned',

  // Inventory Type Category
  INVENTORY_TYPE_CATEGORY_VIEW_ALL = 'inventory_type_category:view_all',

  // Inventory Type Category
  INVENTORY_ZONE_VIEW_ALL = 'inventory_zone:view_all',

  // Point Of Interest
  POINT_OF_INTEREST_CREATE = 'point_of_interest:create',
  POINT_OF_INTEREST_VIEW_ALL = 'point_of_interest:view_all',
  POINT_OF_INTEREST_UPDATE = 'point_of_interest:update',
  POINT_OF_INTEREST_DELETE = 'point_of_interest:delete',

  // Point Of Interest Type
  POINT_OF_INTEREST_TYPE_CREATE = 'point_of_interest_type:create',
  POINT_OF_INTEREST_TYPE_VIEW_ALL = 'point_of_interest_type:view_all',
  POINT_OF_INTEREST_TYPE_UPDATE = 'point_of_interest_type:update',
  POINT_OF_INTEREST_TYPE_DELETE = 'point_of_interest_type:delete',

  // Scheduling
  SCHEDULING_ASSIGN_SHIFT = 'scheduling:assign_shift',
  SCHEDULING_VIEW_STAFF_SHIFTS = 'scheduling:view_staff_shifts',
  SCHEDULING_EVENT_UNSCHEDULE_STAFF = 'scheduling:event_unschedule_staff',
  SCHEDULING_UPDATE = 'scheduling:update',

  // User
  USER_SEND_STAFF_TEXT = 'user:send_staff_text',
  USER_CREATE = 'user:create',
  USER_ADD_NEW_STAFF = 'user:add_new_staff',
  USER_UPLOAD_STAFF = 'user:upload_staff',
  USER_UPLOAD_ATTACHMENT = 'user:upload_attachment',
  USER_BLOCK = 'user:block',
  USER_CREATE_LOCATION = 'user:create_location',
  USER_VIEW_ATTACHMENT = 'user:view_attachment',
  USER_VIEW_ALL = 'user:view_all',
  USER_VIEW_EVENT_USERS = 'user:view_event_users',
  USER_VIEW_LOCATION = 'user:view_location',
  USER_VIEW = 'user:view',
  USER_ASSIGN_DEPARTMENT = 'user:assign_department',
  USER_ASSIGN_DIVISION = 'user:assign_division',
  USER_ASSIGN_EVENT = 'user:assign_event',
  USER_UNASSIGN_EVENT = 'user:unassign_event',
  USER_EVENT_CHANGE_LOG = 'user:user_event_change_log',
  USER_DELETE_ATTACHMENT = 'user:delete_attachment',
  USER_ACT_AS_USER = 'user:act_as_user',
  USER_UPDATE = 'user:update',
  USER_VIEW_DEPARTMENTS_USERS = 'user:view_departments_users',
  USER_VIEW_EVENT_DEPARTMENTS_USERS = 'user:view_event_departments_users',
  USER_VIEW_EVENT_DIVISION_USERS = 'user:view_event_division_users',
  USER_WORKFORCE_LIST_VIEW = 'user:workforce_list_view',
  USER_ADD_EXISTING_STAFF_LISTING = 'user:add_existing_staff_listing',
  USER_EXPORT_CSV_PDF = 'user:export_csv_pdf',
  USER_UPDATE_ROLE = 'user:update_role',
  USER_UPDATE_DEPARTMENT_DIVISION = 'user:update_department_division',
  USER_UPDATE_PERSONAL_INFORMATION = 'user:update_personal_information',
  USER_UPDATE_STATUS = 'user:update_status',
  USER_ASSIGN_UNLINKED_DEPARTMENT = 'user:assign_unlinked_department',
  USER_CHANGE_LOGS = 'user:change_logs',

  // Resolved Incident Note
  RESOLVED_INCIDENT_NOTE_VIEW = 'resolved_incident_note:view',
  RESOLVED_INCIDENT_NOTE_VIEW_ALL = 'resolved_incident_note:view_all',
  RESOLVED_INCIDENT_NOTE_CREATE = 'resolved_incident_note:create',
  RESOLVED_INCIDENT_NOTE_UPDATE = 'resolved_incident_note:update',
  RESOLVED_INCIDENT_NOTE_DELETE = 'resolved_incident_note:delete',

  // *** ANALYTICS MODULE *** //
  // Dashboard/analytics
  DASHBOARD_VIEW_INCIDENTS_BY_TYPE = 'dashboard:view_incidents_by_type',
  DASHBOARD_VIEW_INCIDENTS_BY_PRIORITY = 'dashboard:view_incidents-by-priority',
  DASHBOARD_VIEW_LEGEND = 'dashboard:view_legend',
  DASHBOARD_VIEW_MAP_POINTS = 'dashboard:view_map_points',
  DASHBOARD_VIEW_INCIDENT_DETAILS = 'dashboard:view_incident_details',
  DASHBOARD_VIEW_CRITICAL_INCIDENTS = 'dashboard:view_critical_incidents',
  DASHBOARD_VIEW_CSV_COMPARISON = 'dashboard:view_csv_comparison',
  DASHBOARD_VIEW_GRAPH_COMPARISON = 'dashboard:view_graph_comparison',

  // Event Contact
  EVENT_CONTACT_CREATE = 'event_contact:create',
  EVENT_CONTACT_UPDATE = 'event_contact:update',

  // *** COMMUNICATION MODULE *** //
  // Messages
  MESSAGE_SEND_MESSAGE = 'message:send_message',
  MESSAGE_VIEW_MESSAGES = 'message:view_messages',

  //Weather
  WEATHER_PROVIDER_CREATE = 'weather_provider:create',
  WEATHER_PROVIDER_UPDATE = 'weather_provider:update',
  WEATHER_PROVIDER_VIEW = 'weather_provider:view',
  WEATHER_PROVIDER_DELETE = 'weather_provider:delete',
  WEATHER_PROVIDER_REQUEST = 'weather_provider:request',
  COMPANY_WEATHER_PROVIDER_CREATE = 'company_weather_provider:create',
  COMPANY_WEATHER_PROVIDER_UPDATE = 'company_weather_provider:update',
  WEATHER_PROVIDER_RULES_CREATE = 'weather_provider_rules:create',
  WEATHER_PROVIDER_RULES_UPDATE = 'weather_provider_rules:update',
  WEATHER_PROVIDER_RULES_VIEW = 'weather_provider_rules:view',

  //Message Center
  CONVERSATION_VIEW_ALL = 'conversation:view_all',
  CONVERSATION_UPDATE = 'conversation:update',

  //Notification Center
  EVENT_PLAN_MENTION = 'event_plan:mention',
  EVENT_PLAN_COMPLETE = 'event_plan:complete',
  EVENT_PLAN_UPLOAD = 'event_plan:upload',
  TASK_MENTION = 'task:mention',
  TASK_ASSIGN = 'task:assign',
}
