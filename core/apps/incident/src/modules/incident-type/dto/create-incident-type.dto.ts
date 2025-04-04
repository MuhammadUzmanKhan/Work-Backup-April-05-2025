import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentPriorityApi } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateIncidentTypeDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Incident Type Name' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Color' })
  @IsOptional()
  @IsString()
  color: string;

  @ApiPropertyOptional({
    description: 'Default Priority  must be low, medium, high, critical',
  })
  @IsEnum(IncidentPriorityApi)
  default_priority: IncidentPriorityApi;

  @ApiPropertyOptional({ description: 'Incident Type Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  incident_type_id: number;
}
