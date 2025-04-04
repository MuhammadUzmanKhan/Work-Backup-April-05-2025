import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationModule, NotificationType } from '@Common/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetNotificationDto {
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
  type: NotificationType;

  @ApiProperty({
    description: 'Company Id',
  })
  @IsNumber()
  @Type(() => Number)
  company_id: number;
}
