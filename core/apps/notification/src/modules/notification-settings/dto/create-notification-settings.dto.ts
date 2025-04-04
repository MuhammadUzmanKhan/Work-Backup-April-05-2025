import { IsBoolean, IsEnum, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationModule, NotificationType } from '@Common/enum';

export class NotificationSettingTypeDto {
  @IsEnum(NotificationType)
  notification_type: NotificationType;

  @IsBoolean()
  mobile: boolean;

  @IsBoolean()
  sms: boolean;

  @IsBoolean()
  email: boolean;

  @IsBoolean()
  is_enabled: boolean;
}

export class CreateNotificationSettingsDto {
  @IsEnum(NotificationModule, {
    message:
      'module must be one of the following values: Task, Event, Incident',
  })
  module: NotificationModule;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationSettingTypeDto)
  notification_setting_types: NotificationSettingTypeDto[];
}
