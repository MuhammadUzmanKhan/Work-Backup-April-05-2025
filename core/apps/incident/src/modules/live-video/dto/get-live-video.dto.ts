import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { LiveVideoMode } from '@Common/constants';

export class GetAllLiveVideosDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Pass Video Mode not_start, live, past' })
  @IsOptional()
  @IsEnum(LiveVideoMode)
  video_mode: LiveVideoMode;

  @ApiPropertyOptional({
    description: 'Search by publisher_name',
  })
  @IsOptional()
  @IsString()
  keyword: string;
}
