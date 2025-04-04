//making task_assignement true for testing phase
export const GlobalNotificationSettings = [
  {
    module: 'Task',
    notification_setting_types: [
      {
        notification_type: 'task_assigned',
        mobile: false,
        sms: false,
        email: false,
        is_enabled: false,
      },
      {
        notification_type: 'mention',
        mobile: false,
        sms: false,
        email: false,
        is_enabled: false,
      },
    ],
  },
  {
    module: 'Event',
    notification_setting_types: [
      {
        notification_type: 'mention',
        mobile: false,
        sms: false,
        email: false,
        is_enabled: false,
      },
      {
        notification_type: 'event_plan_complete',
        mobile: false,
        sms: false,
        email: false,
        is_enabled: false,
      },
      {
        notification_type: 'upload',
        mobile: false,
        sms: false,
        email: false,
        is_enabled: false,
      },
    ],
  },
];

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
