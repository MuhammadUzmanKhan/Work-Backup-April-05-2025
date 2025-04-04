import { GlobalNotificationSettings } from '@ontrack-tech-group/common/constants';
import { CreateNotificationSettingsDto } from '../dto';

export const createNotificationSetting = {
  type: CreateNotificationSettingsDto,
  examples: {
    Example: {
      value: GlobalNotificationSettings,
    },
  },
};
