import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { createNotification } from '@ontrack-tech-group/common/services';
import {
  Notification,
  User,
  UserNotification,
} from '@ontrack-tech-group/common/models';
import {
  NotificationInterface,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { CreateNotificationsDto, GetNotificationDto } from './dto';
import {
  getNotificationWhere,
  notificationCountHelper,
  notificationCountWhere,
} from './helpers';

@Injectable()
export class NotificationService {
  constructor() {}

  async createNotification(
    user: User,
    createNotificationsDto: CreateNotificationsDto,
  ) {
    const { message, message_html, module, type, module_id, company_id } =
      createNotificationsDto;

    try {
      await createNotification(
        {
          message,
          message_html,
          module,
          type,
          company_id,
          module_id,
        } as NotificationInterface,
        [user.id],
      );
    } catch (er) {
      console.log('🚀 ~ NotificationService ~ er:', er);
    }

    return { success: true };
  }

  async getAllNotifications(
    getNotificationDto: GetNotificationDto,
    user: User,
  ) {
    return await Notification.findAll({
      where: await getNotificationWhere(getNotificationDto, user),
      attributes: {
        include: [
          [Sequelize.literal(`"user_notifications"."unread"`), 'unread'],
          [
            Sequelize.literal(
              `CASE 
              WHEN "Notification"."module" = 'Task'
              THEN (SELECT "event_id" FROM "tasks" WHERE "public"."tasks"."id" = "Notification"."module_id")
              ELSE NULL
            END`,
            ),
            'event_id',
          ],
          [
            Sequelize.literal(
              `CASE 
              WHEN "Notification"."module" = 'Task'
              THEN (SELECT "task_list_id" FROM "tasks" WHERE "public"."tasks"."id" = "Notification"."module_id")
              ELSE NULL
            END`,
            ),
            'task_list_id',
          ],
          [
            Sequelize.literal(
              `CASE 
              WHEN "Notification"."module" = 'Task'
              THEN (SELECT "parent_id" FROM "tasks" WHERE "public"."tasks"."id" = "Notification"."module_id")
              ELSE NULL
            END`,
            ),
            'parent_id',
          ],
        ],
      },
      include: [
        {
          model: UserNotification,
          attributes: [],
          where: { user_id: user.id },
        },
      ],
      order: [['created_at', SortBy.DESC]],
    });
  }

  async getAllNotificationsCounts(company_id: number, user: User) {
    const counts = await UserNotification.findAll({
      where: {
        user_id: user.id,
        unread: true,
      },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('UserNotification.id')), 'count'],
        [Sequelize.col('notification.type'), 'type'],
        [Sequelize.col('notification.module'), 'module'],
      ],
      include: {
        model: Notification,
        as: 'notification',
        attributes: [],
        required: true,
        where: await notificationCountWhere(company_id, user),
      },
      group: ['notification.type', 'notification.module'],
    });

    const { totalCount, mentionedCounts, moduleCounts } =
      await notificationCountHelper(counts);

    return {
      totalCount,
      mentionedCounts,
      moduleCounts,
    };
  }

  async updateNotification(notification_id: number, user: User) {
    await UserNotification.update(
      { unread: false },
      {
        where: { user_id: user.id, notification_id },
      },
    );

    return { success: true };
  }
}
