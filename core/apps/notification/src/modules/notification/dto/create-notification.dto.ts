import { IsEnum, IsNumber, IsString } from 'class-validator';
import { NotificationModule, NotificationType } from '@Common/enum';

export class CreateNotificationsDto {
  @IsString()
  message: string;

  @IsString()
  message_html: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationModule)
  module: NotificationModule;

  @IsNumber()
  company_id: number;

  @IsNumber()
  module_id: number;
}
