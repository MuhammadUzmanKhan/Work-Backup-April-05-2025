export enum NotificationType {
  MENTION = 'mention',
  TASK_ASSIGNED = 'task_assigned',
  SUBTASK_ASSIGNED = 'subtask_assigned',
  EVENT_PLAN_COMPLETE = 'event_plan_complete',
  UPLOAD = 'upload',
  EVENT_APPROVAL = 'event_approval',
}

export enum NotificationModule {
  TASK = 'Task',
  EVENT = 'Event',
  INCIDENT = 'Incident',
}
