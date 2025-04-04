import { PriorityFilterBothConventionNumber } from '..';

export enum EventStatus {
  UPCOMING = 3,
  IN_PROGRESS = 2,
  COMPLETED = 1,
  ON_HOLD = 0,
}

export enum UserStatuses {
  AVAILABLE = 'available',
  UN_AVAILABLE = 'unavailable',
}

export enum EventStatusAPI {
  UPCOMING = 'upcoming',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export enum MultipleEventStatus {
  COMPLETED = 1,
  IN_PROGRESS = 2,
  UPCOMING = 3,
}

export enum MultipleEventStatusAPI {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  UPCOMING = 'upcoming',
}

export enum EventStatusMap {
  UPCOMING = 'Upcoming',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
}

export enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum IncidentStatusType {
  OPEN = 0,
  DISPATCHED = 1,
  RESPONDING = 7,
  AT_SCENE = 6,
  IN_ROUTE = 5,
  ARCHIVED = 3,
  FOLLOW_UP = 4,
  RESOLVED = 2,
}

export enum IncidentStatusDashboardType {
  OPEN = 0,
  DISPATCHED = 1,
  FOLLOW_UP = 4,
  RESOLVED = 2,
}

export enum StatusFilter {
  OPEN = 'open',
  DISPATCHED = 'dispatched',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived',
  FOLLOW_UP = 'follow_up',
  IN_ROUTE = 'in_route',
  AT_SCENE = 'at_scene',
  RESPONDING = 'responding',
  ALL = 'all',
}

// Added extra enum for incident get api
export enum IncidentStatusFilter {
  OPEN = 'open',
  DISPATCHED = 'dispatched',
  DISPATCHED_ONLY = 'dispatched_only',
  RESOLVED = 'resolved',
  RESOLVED_ONLY = 'resolved_only',
  ARCHIVED = 'archived',
  FOLLOW_UP = 'follow_up',
  IN_ROUTE = 'in_route',
  AT_SCENE = 'at_scene',
  RESPONDING = 'responding',
  ALL = 'all',
  EVICTION_EJECTION = 'eviction_ejection',
  ARREST = 'arrest',
  HOSPITAL_TRANSPORT = 'hospital_transport',
  TREATED_AND_RELEASED = 'treated_and_released',
  RESOLVED_NOTE = 'resolved_note',
}

export enum ResolvedNotesStatus {
  ARREST = 'arrest',
  EVICTION_EJECTION = 'eviction_ejection',
  HOSPITAL_TRANSPORT = 'hospital_transport',
  TREATED_AND_RELEASED = 'treated_and_released',
  RESOLVED_NOTE = 'resolved_note',
}

export enum DispatchedStatusFilter {
  ARCHIVED = 'archived',
  IN_ROUTE = 'in_route',
  AT_SCENE = 'at_scene',
  RESPONDING = 'responding',
}

export enum PriorityFilter {
  LOW = 'low',
  NORMAL = 'normal',
  IMPORTANT = 'important',
  CRITICAL = 'critical',
}

export enum PriorityGuideFilter {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum IncidentTypePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum IncidentPriorityApi {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentStatusDashboardTypeApi {
  OPEN = 'open',
  DISPATCHED = 'dispatch',
  FOLLOW_UP = 'follow_up',
  RESOLVED = 'resolved',
}

export enum PriorityFilterBothConventionString {
  LOW = 'low',
  NORMAL = 'normal',
  MEDIUM = 'medium',
  IMPORTANT = 'important',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export type PriorityFilterBothConventionNumber =
  (typeof PriorityFilterBothConventionNumber)[keyof typeof PriorityFilterBothConventionNumber];
