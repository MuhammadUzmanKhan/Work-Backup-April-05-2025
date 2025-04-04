import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentPriorityApi } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateIncidentTypeDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Incident Type Name' })
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiPropertyOptional({ description: 'Color' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Color should not be empty' })
  color: string;

  @ApiPropertyOptional({
    description: 'Default Priority  must be low, medium, high, critical',
  })
  @IsOptional()
  @IsEnum(IncidentPriorityApi)
  default_priority: IncidentPriorityApi;
}
