import { isUserExist } from '../helpers';
import {
  GlobalNotificationSettings,
  NotificationInterface,
  NotificationSettingFilters,
  NotificationSettingInterface,
  Options,
} from '../constants';
import {
  NotificationSetting,
  NotificationSettingType,
  User,
  Notification,
  UserNotification,
} from '../models';

export const getUserGlobalNotificationSetting = async (
  user: User,
  filters: NotificationSettingFilters,
  options?: Options,
) => {
  const { notification_type, module } = filters;

  const notificationSettings = await NotificationSetting.findAll({
    where: {
      user_id: user.id,
      ...notificationSettingWhere(filters),
    },
    attributes: ['module'],
    include: [
      {
        model: NotificationSettingType,
        as: 'notification_setting_types',
        attributes: {
          exclude: ['id', 'updatedAt', 'createdAt', 'notification_setting_id'],
        },
        required: false,
        where: notification_type ? { notification_type } : {},
      },
    ],
    ...options,
  });

  if (!notificationSettings?.length) {
    if (module) {
      return getNotificationSettingsByModule(module);
    } else {
      return GlobalNotificationSettings;
    }
  }

  return notificationSettings;
};

const notificationSettingWhere = (filters: NotificationSettingFilters) => {
  const _where: Record<string, any> = {};

  const { module } = filters;

  if (module) {
    _where['module'] = module;
  }

  return _where;
};

const getNotificationSettingsByModule = (
  moduleName: string,
): NotificationSettingInterface[] => {
  return [
    GlobalNotificationSettings?.find(
      (item: NotificationSettingFilters) => item.module === moduleName,
    ),
  ] as NotificationSettingInterface[];
};

export const createNotification = async (
  data: NotificationInterface,
  user_ids: number[],
) => {
  const userNotifications = user_ids.map((user_id) => ({
    user_id,
  }));

  const notification = await Notification.create(
    {
      ...data,
      user_notifications: userNotifications,
    },
    {
      include: [{ model: UserNotification }],
    },
  );

  return notification;
};

// Check Permission of passed user_ids and get thier email and phone
export const checkUserNotificationSettingEmailPermission = async (
  user_ids: number[],
  module: string,
  type: string,
) => {
  const userEmails: string[] = [];
  const userNumbers = [];
  const userMobile: string[] = [];

  let userIds: number[] = [];

  for (const user_id of user_ids) {
    const user = await isUserExist(user_id);

    const notificationSettings = await getUserGlobalNotificationSetting(user, {
      module,
    } as NotificationSettingFilters);

    const typeSettings = notificationSettings[0][
      'notification_setting_types'
    ].find((setting) => setting.notification_type === type);

    if (typeSettings?.is_enabled && typeSettings?.email) {
      userEmails.push(user.email);
      userIds.push(user.id);
    }

    if (typeSettings?.is_enabled && typeSettings?.sms) {
      const cell = {
        cell: user?.country_code + user?.cell,
        sender_cell: user?.sender_cell,
      };
      userNumbers.push(cell);
      userIds.push(user.id);
    }

    if (typeSettings?.is_enabled && typeSettings?.mobile) {
      userMobile.push(user?.cell);
    }
  }
  userIds = [...new Set(userIds)];

  return { userEmails, userNumbers, userMobile };
};
