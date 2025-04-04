import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AlertableType } from '@ontrack-tech-group/common/constants';
import { CloneDto } from '@Common/dto';

export class CloneAlertsDto extends CloneDto {
  @ApiPropertyOptional({ description: 'Pass IncidentType or PriorityGuide' })
  @IsOptional()
  @IsEnum(AlertableType)
  alertable_type: AlertableType;
}
