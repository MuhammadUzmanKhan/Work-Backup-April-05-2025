import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { NotificationModule, NotificationType } from '@Common/enum';

export class UpdateNotificationSettingDto {
  @IsEnum(NotificationModule)
  module: NotificationModule;

  @IsEnum(NotificationType)
  notification_type: NotificationType;

  @IsOptional()
  @IsBoolean()
  is_enabled: boolean;

  @IsOptional()
  @IsBoolean()
  sms: boolean;

  @IsOptional()
  @IsBoolean()
  email: boolean;

  @IsOptional()
  @IsBoolean()
  mobile: boolean;
}
