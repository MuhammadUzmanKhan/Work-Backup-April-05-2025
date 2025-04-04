import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { AlertableType } from '@ontrack-tech-group/common/constants';

export class CloneDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  current_event_id: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  clone_event_id: number;
}

export class CloneAlertsDto extends CloneDto {
  @ApiPropertyOptional({ description: 'Pass IncidentType or PriorityGuide' })
  @IsOptional()
  @IsEnum(AlertableType)
  alertable_type: AlertableType;
}
