import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdatePriorityGuideScaleSettingDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Pass true for showing P1-P4 scales' })
  @IsOptional()
  @IsBoolean()
  scale_setting: boolean;

  @ApiPropertyOptional({ description: 'Pass true for ' })
  @IsOptional()
  @IsBoolean()
  updated_description: boolean;
}
