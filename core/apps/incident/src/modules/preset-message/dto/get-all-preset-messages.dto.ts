import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetPresetMessageDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Preset title and hot_key' })
  @IsOptional()
  @IsString()
  keyword: string;
}
