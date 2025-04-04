import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PriorityGuideFilter } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdatePriorityGuideDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Pass name of priority_guide' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiPropertyOptional({
    description: 'Example: low, medium, critical or high',
  })
  @IsOptional()
  @IsEnum(PriorityGuideFilter)
  priority: PriorityGuideFilter;

  @ApiPropertyOptional({ description: 'Description of priority' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Pass true for showing P1-P4 scales' })
  @IsOptional()
  @IsBoolean()
  scale_setting: boolean;
}
