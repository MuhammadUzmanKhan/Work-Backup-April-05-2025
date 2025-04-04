import { Op } from 'sequelize';
import { Event } from '@ontrack-tech-group/common/models';
import { CommunicationService } from '@ontrack-tech-group/common/services';
import { EventGenre } from '@ontrack-tech-group/common/constants';
import { QueuesService } from '@Modules/queues/queues.service';

export interface SendResponse {
  userErrors?: {
    name?: string;
    cell?: string;
    department?: string;
    error?: string;
  }[];
}
export interface EventUploadCsv {
  eventErrors?: {
    name: string;
    about_event: string;
    start_date: string;
    end_date: string;
    time_zone: string;
    event_location: string;
    staff_future: boolean;
    department_future: boolean;
    vendor_future: boolean;
    reservation_future: boolean;
    camping_future: boolean;
    inventory_future: boolean;
    service_request_future: boolean;
    incident_future: boolean;
    incident_future_v2: boolean;
    reporting_future: boolean;
    dot_map_service_v2: boolean;
    transportation_future: boolean;
    lost_and_found_future: boolean;
    audit_future: boolean;
    key_genre: EventGenre;
    public_start_date: string;
    public_end_date: string;
    ticket_clear_template_future: boolean;
    status: number;
    expected_attendance: number;
    daily_attendance: number;
    event_category: string;
    venue_name: string;
  }[];
}

export interface SingleUserIncidentDivisions {
  incidentDivisionIds: number[];
  userId: number;
}

export interface NotificationData {
  event_id: number;
  company_id: number;
  event: Event;
  module: string;
  type: string;
  subject: string;
  message: string;
  message_html: string;
  queueService?: QueuesService;
  communicationService?: CommunicationService;
  user_ids?: number[];
  comment_id?: number;
  sub_type?: string;
}

export interface UserSearchAttributes {
  name?: string | { [Op.iLike]: string };
  cell?: string | { [Op.iLike]: string };
  email?: string | { [Op.iLike]: string };
  country_code?: string | { [Op.iLike]: string };
}
