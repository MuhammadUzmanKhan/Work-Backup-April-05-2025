export enum TaskSortingColumns {
  NAME = 'name',
  PRIORITY = 'priority',
  STATUS = 'status',
  START_DATE = 'start_date',
  DEADLINE = 'deadline',
  CREATED_AT = 'created_at',
  DEPARTMENT = 'department_name',
  INCIDENT_DIVISION = 'incident_division_name',
}

export enum TaskStatus {
  IN_PROGRESS = 'In Progress',
  OPEN = 'Open',
  COMPLETED = 'Completed',
  BLOCKED = 'Blocked',
}

export enum TaskStatusFilter {
  IN_PROGRESS = 'In Progress',
  OPEN = 'Open',
  COMPLETED = 'Completed',
  BLOCKED = 'Blocked',
  PAST_DUE = 'Past Due',
}

export enum FilterField {
  DEADLINE = 'deadline',
  ASSIGNEE = 'assignee',
  STATUS = 'status',
  DIVISION = 'division',
  CATEGORIES = 'categories',
  LIST = 'list',
}

export enum FilterCondition {
  EQ = 'EQ',
  NOT_EQ = 'NOT_EQ',
}

export enum CloneORCopy {
  CLONE = 'Clone',
  COPY = 'Copy',
}

export enum ChangeLogColumns {
  NAME = 'name',
  DESCRIPTION = 'description',
  STATUS = 'status',
  START_DATE = 'start_date',
  DEADLINE = 'deadline',
  INCIDENT_DIVISION = 'incident_division',
  CATEGORIES = 'categories',
  LOCATION = 'location',
  LIST = 'list',
  COLOR = 'color',
  ATTACHMENT = 'attachment',
}

export enum _PDFTypes {
  TASK_DETAIL_REPORT = 'TASK_DETAIL_REPORT',
}
