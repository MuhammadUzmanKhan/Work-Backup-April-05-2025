import momentTimezone from 'moment-timezone';
import { Op, Sequelize } from 'sequelize';
import {
  checkUserNotificationSettingEmailPermission,
  CommunicationService,
  createNotification,
  getUserGlobalNotificationSetting,
  PusherService,
} from '@ontrack-tech-group/common/services';
import {
  MessageGroupableType,
  NotificationInterface,
  NotificationModule,
  NotificationSettingFilters,
  NotificationType,
  TemplateNames,
} from '@ontrack-tech-group/common/constants';
import {
  Department,
  Event,
  Image,
  MessageGroup,
  Task,
  User,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import { throwCatchError } from '@ontrack-tech-group/common/helpers';
import { assignTaskMessage, TaskStatus } from '@Common/constants';
import { assignTaskEmail } from './notification-email';
import { mentionTaskMessage } from './mention-message';

// TODO: This function will be complete in future.
export const fetchMessageGroupUsers = async (
  company_id: number,
  messageGroup: MessageGroup,
) => {
  const { message_groupable_type, event_id, message_groupable_id, id } =
    messageGroup;

  const _include = [];
  let _where = {};

  if (message_groupable_type === MessageGroupableType.EVENT) {
    _include.push({
      model: MessageGroup,
      where: {
        id,
        event_id,
        company_id,
      },
    });
  } else if (message_groupable_type === MessageGroupableType.DEPARTMENT) {
    _where = { company_id };

    _include.push({
      model: Department,
      through: { attributes: [] },
      where: { id: message_groupable_id },
      attributes: ['id'],
      include: [
        {
          model: Event,
          where: {
            id: event_id,
            company_id,
          },
          attributes: ['id', 'company_id'],
        },
      ],
    });
  } else if (
    message_groupable_type === MessageGroupableType.INCIDENT_DIVISION
  ) {
    _include.push({
      model: UserIncidentDivision,
      where: { event_id, incident_division_id: message_groupable_id },
      attributes: [],
    });
  } else if (message_groupable_type === MessageGroupableType.INVENTORY_ZONE) {
    //TODO
  } else if (message_groupable_type === MessageGroupableType.RESERVATION_TYPE) {
    //TODO
  } else if (message_groupable_type === MessageGroupableType.ROUTE) {
    //TODO
  } else if (message_groupable_type === MessageGroupableType.SHIFT) {
    //TODO
  }

  const groupUsers = await User.findAll({
    where: { ..._where, blocked_at: { [Op.eq]: null } },
    attributes: [
      'id',
      'name',
      'email',
      'cell',
      'message_service',
      'country_code',
      [User.getUserRoleByKey, 'role'],
    ],
    include: _include,
  });

  return groupUsers;
};

export const getTimeInAmPm = (time: string) => {
  // Date is just random date to create a date instance
  return new Date(`2000-01-01 ${time}`).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const sendTaskCountUpdate = async (
  event_id: number,
  pusherService: PusherService,
) => {
  try {
    const event = await Event.findByPk(event_id, {
      attributes: [[Event.getStatusNameByKey, 'status']],
    });

    pusherService.sendModuleCountUpdate({
      event_id,
      module: 'task_future',
      status: event['status'] as unknown as string,
    });
  } catch (error) {}
};

export const imageInclude = (createdByQuery: any): any => ({
  model: Image,
  attributes: [
    'id',
    'name',
    'url',
    'createdAt',
    'creator_id',
    'thumbnail',
    createdByQuery,
  ],
  include: [
    {
      model: User,
      as: 'created_by',
      attributes: [],
    },
  ],
});

export const imageIncludeForCloning = (createdByQuery: any): any => ({
  model: Image,
  attributes: ['name', 'url', 'createdAt', 'thumbnail', createdByQuery],
  include: [
    {
      model: User,
      as: 'created_by',
      attributes: [],
    },
  ],
});

export const pushNotificationJson = async (
  userCell: string,
  task: Task,
  event: Event,
  text: string,
  isSubtask: boolean,
  isCommentMention: boolean = false,
) => {
  const msg = text;

  return JSON.stringify({
    android_channel_id: process.env.ANDROID_CHANNEL_ID,
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: { en: task.name },
    subtitle: { en: event.name },
    contents: { en: msg },
    include_external_user_ids: [userCell],
    channel_for_external_user_ids: 'push',
    additional_data_is_root_payload: true,
    ios_interruption_level: 'time_sensitive',
    ios_sound: 'notification.wav',
    data: {
      event_id: event.id,
      [isSubtask ? 'subtask_id' : 'task_id']: task.id,
      ...(isSubtask && { task_id: task.parent_id }),
      company_id: event.company_id,
      type: 'task',
      ...(isCommentMention && { sub_type: 'comment' }),
    },
  });
};

/**
 * This function is designed to send both a push notification and an SMS to a user regarding a task assignment.
 * It handles the creation of the notification content, communication with the service to send the notifications, and error handling in case of failures.
 *
 * @param user - The user object containing details about the recipient, including their contact information.
 * @param task - The task object representing the assigned task.
 * @param parentTask - The parent task object, if the assigned task is a subtask.
 * @param event - The event object that triggered the notification.
 * @param communicationService - The service responsible for sending notifications and messages.
 */
export const pushNotificationAndSMS = async (
  user: User,
  task: Task,
  parentTaskName: string,
  event: Event,
  communicationService: CommunicationService,
  company_id?: number,
  pusherService?: PusherService,
) => {
  //Get user notification configuration
  const notificationSettings = await getUserGlobalNotificationSetting(user, {
    module: 'Task',
  } as NotificationSettingFilters);

  const typeSettings = notificationSettings[0][
    'notification_setting_types'
  ].find(
    (setting) => setting.notification_type === NotificationType.TASK_ASSIGNED,
  );

  const notificationBody = await pushNotificationJson(
    user.cell,
    task,
    event,
    task.parent_id
      ? `You have been assigned a new Sub Task under the Main Task - ${parentTaskName}`
      : 'You have been assigned a new Task',
    task.parent_id ? true : false, // returning is subtask flag (true or false)
  );

  // Send Push Notification to Mobile.
  try {
    if (typeSettings.is_enabled && typeSettings.mobile) {
      await communicationService.communication(
        { notificationBody },
        'send-push-notification',
      );
    }
  } catch (e) {
    console.error('Push notification error:', e);
  }

  // Send SMS to a user
  try {
    if (typeSettings.is_enabled && typeSettings.sms) {
      const userNumbers = [
        {
          cell: `${user.country_code}${user.cell}`,
          sender_cell: user.sender_cell || null,
        },
      ];

      // getting link task assignee message body
      const messageBody = assignTaskMessage(task, parentTaskName, event);

      await communicationService.communication(
        {
          messageBody,
          userNumbers,
        },
        'send-message',
      );
    }
  } catch (e) {
    console.error('Message sending error:', e);
  }

  try {
    if (typeSettings.is_enabled && typeSettings.email) {
      const emailBody = assignTaskEmail(task, parentTaskName, event);
      const emailData = {
        email: [user.email],
        assigneeName: user.name,
        ...emailBody,
      };

      await communicationService.communication(
        {
          data: emailData,
          template: TemplateNames.TASK_ASSIGNED,
          subject: 'Task Assigned to you',
        },
        'send-email',
      );
    }
  } catch (err) {
    console.log('🚀 ~ err:', err);
  }

  try {
    const parentTask = task.parent_id
      ? `under the main task - <strong>${parentTaskName}</strong>.`
      : '.';
    const message = `You have been assigned to ${task.name} ${parentTask}`;
    const message_html = `You have been assigned to <strong>${task.name}</strong> ${parentTask}`;

    const notificationData = {
      user_id: user.id,
      message,
      message_html,
      module: NotificationModule.TASK,
      type: task.parent_id
        ? NotificationType.SUBTASK_ASSIGNED
        : NotificationType.TASK_ASSIGNED,
      company_id,
      module_id: task.id,
      event_id: event.id,
    };

    const notification = await createNotification(
      {
        ...notificationData,
      } as NotificationInterface,
      [user.id],
    );

    notificationData['id'] = notification.id;
    notificationData['unread'] = true;
    notificationData['parent_id'] = task?.parent_id ? task?.parent_id : null;

    pusherService.sendNotificationSocket(notificationData);
  } catch (err) {
    console.log('🚀 ~ err:', err);
  }
};

export const currentTimestamp = (eventTimezone: string) =>
  momentTimezone().tz(eventTimezone).format('YYYY-MM-DDTHH:mm:ss:mss[Z]');

export const isPastDue = (alias: string, eventTimezone: string): any => [
  Sequelize.literal(`EXISTS (
      SELECT 1 FROM "tasks" AS "_tasks"
      WHERE "_tasks"."id" = "${alias}"."id"
      AND "_tasks"."deadline" < '${currentTimestamp(eventTimezone)}'
      AND "_tasks"."status" != '${TaskStatus.COMPLETED}'
    )`),
  'is_past_due',
];

export const smsEmailForMentionedUser = async (
  user_ids: number[],
  company_id: number,
  task: Task,
  event: Event,
  user: User,
  communicationService: CommunicationService,
  pusherService: PusherService,
  comment_id: number,
) => {
  const { userEmails, userNumbers, userMobile } =
    await checkUserNotificationSettingEmailPermission(
      user_ids,
      NotificationModule.TASK,
      NotificationType.MENTION,
    );

  const messageBody = mentionTaskMessage(task, event, user);

  if (user_ids?.length) {
    const message = `${user.name} mentioned you in a task ${task.name}`;
    const message_html = `<strong>${user.name}</strong> mentioned you in a task <strong>${task.name}</strong>`;
    const notification = await createNotification(
      {
        message,
        message_html,
        module: NotificationModule.TASK,
        type: NotificationType.MENTION,
        company_id,
        module_id: task.id,
        comment_id,
      },
      user_ids,
    );

    for (const user_id of user_ids) {
      const notificationData = {
        id: notification.id,
        user_id,
        message,
        message_html,
        module: NotificationModule.TASK,
        type: NotificationType.MENTION,
        company_id,
        module_id: task.id,
        event_id: event.id,
        comment_id,
        unread: true,
        parent_id: task?.parent_id ? task?.parent_id : null,
      };

      pusherService.sendNotificationSocket(notificationData);
    }
  }

  if (userNumbers?.length) {
    // send message to user who is mentioned in a comment.
    try {
      await communicationService.communication(
        {
          messageBody,
          userNumbers,
        },
        'send-message',
      );
    } catch (err) {
      throwCatchError(err);
    }
  }

  if (userEmails?.length) {
    try {
      const emailBody = assignTaskEmail(
        task.get({ plain: true }),
        null,
        event,
        true,
      );

      const emailData = {
        email: userEmails,
        ...emailBody,
      };

      await communicationService.communication(
        {
          data: emailData,
          template: TemplateNames.TASK_COMMENT_MENTION,
          subject: 'You have been mentioned in a Task',
        },
        'send-email',
      );
    } catch (err) {
      throwCatchError(err);
    }
  }

  // Send Push Notification to Mobile.
  if (userMobile?.length) {
    try {
      for (const cell of userMobile) {
        const notificationBody = await pushNotificationJson(
          cell,
          task,
          event,
          task.parent_id
            ? `You have been mentioned in a Sub Task ${task.name}`
            : `You have been mentioned in a Task ${task.name}`,
          task.parent_id ? true : false, // returning is subtask flag (true or false)
          true,
        );

        await communicationService.communication(
          { notificationBody },
          'send-push-notification',
        );
      }
    } catch (err) {
      throwCatchError(err);
      console.error('Push notification error:', err);
    }
  }
};
