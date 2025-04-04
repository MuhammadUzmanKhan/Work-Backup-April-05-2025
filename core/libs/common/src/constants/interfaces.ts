import { Op, Transaction, WhereOptions } from 'sequelize';
import { PinableType } from './enums';
import { Literal } from 'sequelize/types/utils';
import { User } from '../models';

export interface FormattedComment {
  commented_by: string;
  created_by: {
    id: number;
    name: string;
    cell: string;
    type: any;
  };
  created_at?: string;
  event_id: number;
  id: number;
  commentable_id: number;
  commentable_type: string;
  text: string;
  creator_id: number;
  creator_type: string;
  count?: number;
}

export interface IncidentCountStatus {
  status: string;
  priority: string;
  count: number;
}

export interface FormattedDataForEventCsv {
  'Event Name': string;
  Location: string;
  'Event Venue': string;
  'Event Date': string;
  'Time Zone': string;
  'Event Genre': string;
  'Show Status': number | string;
}

export interface FormattedDataForCompanyCsv {
  Company: string;
  Country: string;
  Parent: string;
  'Sub Companies': number;
  EventCount: number;
}

export interface FormattedDataForCompanyPdf {
  company: string;
  country: string;
  parent: string;
  subcompanies: number;
  eventcount: number;
}

export interface FormattedDataForSubcompanyCsv {
  Companies: string;
  Country: string;
  'Active Events': string;
  'Total Events': number;
}

export interface FormattedDataForSubcompanyPdf {
  parent: string;
  name: string;
  country: string;
  activeEvents: string[];
  totalEvents: number;
}

export interface FormattedEventForPdf {
  name: string;
  url: string;
  key_genre: string;
  genre: string;
  sub_genre: string;
  about_event: string;
  venue: string;
  location: string;
  time_zone: string;
  event_date: string;
  transportation_future: boolean | string;
  workforce_messaging: boolean | string;
  vendor_future: boolean | string;
  staff_future: boolean | string;
  show_block: boolean | string;
  service_request_future: boolean | string;
  reservation_future: boolean | string;
  messaging_capability: boolean | string;
  message_service: boolean | string;
  lost_and_found_future: boolean | string;
  inventory_future: boolean | string;
  incident_future: boolean | string;
  guest_messaging: boolean | string;
  dot_map_service: boolean | string;
  deposit_full_charges: boolean | string;
  department_future: boolean | string;
  camping_future: boolean | string;
  company_name: string;
}

export interface FormattedStaffListingForCsv {
  'First Name': string;
  'Last Name': string;
  Department: string;
  Division: string;
  Email: string;
  'Country Code': string;
  Phone: string;
  Role: string | number;
}

export interface FormattedDepartmentsCardViewDataForCsv {
  Name: string;
  Divisions: number;
  Staff: number;
  'Available Staff': number;
  'Unavailable Staff': number;
}

export interface FormattedDivisionsCardViewDataForCsv {
  Name: string;
  'Department Count': number;
  'Staff Count': number;
}

export interface FormattedPointOfInterestDataForCsv {
  'POI Name': string;
  'POI Type': string;
  Status: string;
}

export interface TaskLocation {
  latitude: string;
  longitude: string;
}

export interface MultipleUserPins {
  pinable_id: number;
  user_id: number;
  pinable_type: PinableType;
  order?: number;
}

export interface DeleteIncidentType {
  incident_type_id: number;
  key: string;
}

export interface EventAndModuleCount {
  event_id: number;
  module: string;
  status: string;
}

export interface IncidentDivisionWithIdName {
  id: number;
  name: string;
}

export interface Editor {
  editor_id: number;
  editor_name: string;
}

export interface Options {
  useMaster: boolean;
}

export interface FindOptionsInterface {
  id?: number;
  name?: string;
  company_id?: number;
  event_id?: number;
}

export interface NotificationSettingFilters {
  module?: string;
  notification_type?: string;
}

export interface NotificationInterface {
  message: string;
  message_html: string;
  module: string;
  company_id: number;
  type: string;
  module_id: number;
  comment_id?: number;
}

export interface NotificationSettingInterface {
  module: string;
  notification_setting_types: {
    notification_type: string;
    mobile: boolean;
    sms: boolean;
    email: boolean;
    is_enabled: boolean;
  }[];
}

export interface NotificationSocket {
  module: string;
  module_id: number;
  type: string;
  message_html: string;
  message: string;
  user_id: number;
  company_id: number;
  event_id?: number;
}

export type LiteralStringArray = (string | [Literal, string])[];

export interface IncidentStatsByStatus {
  Dispatched: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  Resolved: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  Open: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  'Follow Up': {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export type HourlyData = Record<string, [string, number][]>;
export interface IncidentDashboardStats {
  incidents_by_status: ObjectWithNumbersValue;
  incidents_by_priorities: ObjectWithNumbersValue;
  statusCount: IncidentStatsByStatus;
  hours_data_with_status_counts: HourlyData;
}
export interface GraphDataInterface {
  counts: {
    incidentCounts: number;
  };
  data: IncidentDashboardStats;
}

export type ObjectWithNumbersValue = { [key: string]: number };

export type ObjectWithNestedObjectsHavingNumbersValue = {
  [key: string]: ObjectWithNumbersValue;
};

export interface CellNumbersForAlerts {
  cell: string;
  onlyCell?: string;
  onlyCells?: string;
  sender_cell?: string;
}

export type WhereClause = WhereOptions<any> & {
  [Op.and]?:
    | WhereClause
    | Literal
    | string
    | number
    | Record<string, any>
    | Array<WhereClause | Literal | string | number | Record<string, any>>;
  [Op.or]?:
    | WhereClause
    | Literal
    | string
    | number
    | Record<string, any>
    | Array<WhereClause | Literal | string | number | Record<string, any>>;
};

export interface PaginationInterface {
  total_count: number;
  total_pages: number;
  current_page: number;
  next_page: number | null;
  prev_page: number | null;
}

export type UserWithRole = (User & { role: number })[];

export interface HookBasicOptionsInterface {
  transaction?: Transaction;
  editor?: Editor;
}

export interface IncidentTypeTranslationUpdateInterface
  extends HookBasicOptionsInterface {
  company?: { company_id: number; sub_company_id: number };
}

export interface IncidentTypeTranslationCreateInterface
  extends HookBasicOptionsInterface {
  company?: {
    company_id: number;
    sub_company_id: number;
    core_incident_type_name: string;
    core_incident_type_id: number;
  };
}

export interface IncidentTypeCreateInterface extends HookBasicOptionsInterface {
  company_id?: number;
}

export type LocationRecord = {
  locationable_id: number;
  locationable_type: string;
  event_id: number;
  latitude: string;
  longitude: string;
  distance?: number;
  eta?: string;
  speed?: number;
  battery_level?: number;
};
