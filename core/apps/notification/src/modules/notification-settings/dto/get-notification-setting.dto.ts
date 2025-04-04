import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationModule, NotificationType } from '@Common/enum';

export class GetNotificationSettingDto {
  @ApiPropertyOptional({
    description: 'Notification Module',
    enum: NotificationModule,
  })
  @IsOptional()
  @IsEnum(NotificationModule)
  module: NotificationModule;

  @ApiPropertyOptional({
    description: 'Notification Type',
    enum: NotificationType,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  notification_type: NotificationType;
}
