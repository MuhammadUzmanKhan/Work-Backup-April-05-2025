import { User } from '@ontrack-tech-group/common/models';

export interface IncidentByPriorityAndStatus {
  status: string;
  priority: string;
  count: number;
}

export interface IncidentByPriority {
  [key: string]: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface CompanyMessage {
  body: {
    companyId: number;
    isNewCompany: boolean;
  };
  user: User;
}

export interface EventMessage {
  body: {
    eventId: number;
    isNewEvent: boolean;
  };
  user: User;
}

export interface UpdateIncidentMessage {
  body: {
    eventId: number;
    incidentId: number;
  };
  user?: User;
}

export interface ResolvedIncidentNoteMessage {
  body: {
    id: number;
    is_new_resolved_note: boolean;
  };
  user?: User;
}
