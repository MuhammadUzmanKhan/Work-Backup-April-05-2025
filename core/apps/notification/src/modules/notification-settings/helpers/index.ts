import {
  NotificationSetting,
  NotificationSettingType,
  User,
} from '@ontrack-tech-group/common/models';

export const createNotificationSettingHelper = async (
  createNotificationSettingDto,
  user: User,
) => {
  const notificationSettingsData = createNotificationSettingDto.map(
    (setting: NotificationSetting) => ({
      ...setting,
      user_id: user.id,
    }),
  );

  await NotificationSetting.bulkCreate(notificationSettingsData, {
    include: [
      { model: NotificationSettingType, as: 'notification_setting_types' },
    ],
  });

  return true;
};
