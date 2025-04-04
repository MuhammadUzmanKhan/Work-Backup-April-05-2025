import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { AlertableType } from '@ontrack-tech-group/common/constants';

export class GetAllAlerts extends IntersectionType(EventIdQueryDto) {
  @ApiPropertyOptional({
    description: 'Search by first_name, last_name or cell number',
  })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pass IncidentType, PriorityGuide',
    enum: AlertableType,
  })
  @IsOptional()
  @IsEnum(AlertableType)
  alertable_type: AlertableType;
}
