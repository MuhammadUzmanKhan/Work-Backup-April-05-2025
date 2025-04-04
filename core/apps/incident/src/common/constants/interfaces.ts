import { IncidentQueryParamsDto } from '@Modules/incident/dto';
import {
  ChangeLog,
  Department,
  Scan,
  User,
} from '@ontrack-tech-group/common/models';

export type IncidentTypeDefaultPriority = {
  default_priority: string;
  count?: number;
};

export interface IncidentByPriorityAndStatus {
  status: string;
  priority: string;
  count: number;
}

export interface LinkIncidentData {
  parent_id: number;
  status?: number;
}

export interface IncidentDashboard {
  hour: number;
  priority: string;
  status: string;
  incidentCounts: number;
}

export interface FormattedEventNotesDataForPdf {
  name: string;
  start_date: string;
  end_date: string;
  event_location: string;
  event_notes: Array<{
    body: string;
    user: User;
    created_at: string;
  }>;
}

// User interface
export interface UserModelForIncidentsAPI {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  cell: string;
  country_code: string;
  email?: string;
  role?: string;
  status?: string;
  department: {
    id: number;
    name: string;
  };
  incident_scans?: any; // Assuming scan details might be complex
}

// IncidentDivision interface
interface IncidentDivision {
  id: number;
  name: string;
}

// ResolvedIncidentNote interface
interface ResolvedIncidentNote {
  id: number;
  status: string | null; // Possible values: 'arrest', 'eviction_ejection', etc.
}

// Location interface
interface Location {
  id: number;
  locationable_id: number;
  latitude: string;
  longitude: string;
  distance?: number;
  eta?: number;
  speed?: number;
  battery_level?: number;
  event_id: number;
  createdAt: Date;
}

// IncidentZone interface
interface IncidentZone {
  id: number;
  name: string;
  color: string;
  latitude: string;
  longitude: string;
  parent?: IncidentZone;
}

// Image interface
interface Image {
  id: number;
  name: string;
  url: string;
  createdAt: Date;
  thumbnail: string;
  imageable_id: number;
  capture_at: Date;
  createdBy: string;
}

// Event interface
interface Event {
  id: number;
  time_zone: string;
}

// IncidentForm interface
interface IncidentForm {
  id: number;
  form_type: string;
}

// Creator interface
interface Creator {
  id: number;
  name: string;
}

// Reporter interface
interface Reporter {
  id: number;
  name: string;
}

// Formatted Incident Interface
export interface FormattedIncidentData {
  id: number;
  description: string;
  department_id?: string;
  hasEditAccess: boolean;
  status: string; // Assuming status is mapped to a string via Incident.getStatusNameByKey
  priority: string; // Assuming priority is mapped to a string via Incident.getPriorityNameByKeyNewMapping
  resolved_time: Date | null;
  updated_by: number | null; // Casting updated_by as integer
  unread: boolean;
  updated_by_type: string | null;
  created_by: number;
  created_by_type: string;
  has_image: boolean;
  has_comment: boolean;
  locator_code: string;
  user_id: number | null;
  event_id: number | null;
  reporter_id: number | null;
  parent_id: number | null;
  created_at: Date;
  incident_type_id: number;
  incident_zone_id: number;
  logged_date_time: Date | null;
  source_id: number | null;
  company_id: number;
  row: string | null;
  seat: string | null;
  section: string | null;

  // Existing enriched attributes
  incident_type: string | null;
  reporter: Reporter | null;
  has_linked_incidents: boolean;
  linked_incident_counts: number;
  incident_form_type: IncidentForm | null;
  event: Event | null;
  creator: Creator | null;
  images: Image[];
  incident_zone: IncidentZone | null;
  incident_divisions: IncidentDivision[];
  location: Location | null;
  resolved_incident_note: ResolvedIncidentNote | null;
  users: UserModelForIncidentsAPI[];
  department: Department;
  comments_count: number;
  dispatch_department_staff: any[];
  dispatch_departments?: any[];
}

export interface GetIncidentResolvedTimeWithNullZones {
  get_incident_resolved_time_null_zones: GetResolvedTimeForNullZones;
}
export interface GetResolvedTimeForNullZones {
  'Field Location Logged': {
    avg_resolved_time: string;
    incident_count: number;
  };
}

export interface CSVDownload {
  incidentQueryParamsDto: IncidentQueryParamsDto;
  companyId: number;
  user: User;
  availableDivisionIds: number[];
  unAvailableDivisionIds: number[];
  incidentDivisionIds: number[];
  _page?: number;
  _page_size?: number;
}

export interface UserWithCompanyId extends User {
  company_id?: number;
  is_super_admin?: boolean;
}

export interface IScan extends Scan {
  created_at: string;
}

export interface IChangeLog extends ChangeLog {
  created_at: string;
}
