import { Sequelize } from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';
import {
  NotificationSetting,
  NotificationSettingType,
  User,
} from '@ontrack-tech-group/common/models';
import { getUserGlobalNotificationSetting } from '@ontrack-tech-group/common/services';
import { throwCatchError } from '@ontrack-tech-group/common/helpers';
import {
  GlobalNotificationSettings,
  Options,
} from '@ontrack-tech-group/common/constants';
import {
  CreateNotificationSettingsDto,
  GetNotificationSettingDto,
  UpdateNotificationSettingDto,
} from './dto';
import { createNotificationSettingHelper } from './helpers';

@Injectable()
export class NotificationSettingService {
  constructor(private readonly sequelize: Sequelize) {}

  async createNotificationSetting(
    createNotificationSettingDto: CreateNotificationSettingsDto[],
    user: User,
  ) {
    const transaction = await this.sequelize.transaction();

    try {
      // Prepare data with nested NotificationSettingType objects
      const notificationSettingsData = createNotificationSettingDto.map(
        (setting) => ({
          ...setting,
          user_id: user.id,
        }),
      );

      await NotificationSetting.bulkCreate(notificationSettingsData, {
        include: [
          { model: NotificationSettingType, as: 'notification_setting_types' },
        ],
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    return this.getUserNotificationSetting(
      { module: null } as GetNotificationSettingDto,
      user,
      { useMaster: true },
    );
  }

  async getUserNotificationSetting(
    filters: GetNotificationSettingDto,
    user: User,
    options?: Options,
  ) {
    return await getUserGlobalNotificationSetting(user, filters, options);
  }

  async updateNotificationSetting(
    updateNotificationSettingDto: UpdateNotificationSettingDto,
    user: User,
  ) {
    const { module, notification_type, sms, email, mobile } =
      updateNotificationSettingDto;
    const globalSettings = GlobalNotificationSettings;

    const notificationSetting = await NotificationSetting.findOne({
      where: { user_id: user.id, module },
      attributes: ['id'],
      include: [
        {
          model: NotificationSettingType,
          where: { notification_type },
          required: true,
        },
      ],
    });

    if (!notificationSetting) {
      globalSettings.forEach((item) => {
        if (item.module === updateNotificationSettingDto.module) {
          const index = item.notification_setting_types.findIndex(
            (type) => type.notification_type === notification_type,
          );

          if (index !== -1) {
            const { module, ...settingsToUpdate } =
              updateNotificationSettingDto;

            // Completely replace the setting at the found index with the new DTO
            item.notification_setting_types[index] = {
              ...settingsToUpdate, // Replace with new properties, excluding `module`
            };

            return item.notification_setting_types[index];
          }
        }
      });
      await createNotificationSettingHelper(globalSettings, user);
    } else {
      if (!sms && !email && !mobile)
        updateNotificationSettingDto['is_enabled'] = false;

      await NotificationSettingType.update(updateNotificationSettingDto, {
        where: {
          id: notificationSetting['notification_setting_types'][0]?.id,
        },
      });
    }

    return this.getUserNotificationSetting(
      { module: null } as GetNotificationSettingDto,
      user,
      { useMaster: true },
    );
  }
}
