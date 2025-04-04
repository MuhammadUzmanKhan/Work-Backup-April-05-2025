import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentPriorityApi } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class RequestIncidentTypeDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Incident Type Name' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Default Priority  must be low, medium, high, critical',
  })
  @IsOptional()
  @IsEnum(IncidentPriorityApi)
  default_priority: IncidentPriorityApi;
}
