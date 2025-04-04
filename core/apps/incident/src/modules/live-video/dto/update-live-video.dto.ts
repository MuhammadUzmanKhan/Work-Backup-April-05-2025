import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { LiveVideoMode, LiveVideoStreamingRequest } from '@Common/constants';

export class UpdateLiveVideoDto extends EventIdQueryDto {
  @IsOptional()
  @IsEnum(LiveVideoMode)
  video_mode: LiveVideoMode;

  @IsOptional()
  @IsEnum(LiveVideoStreamingRequest)
  streaming_request: LiveVideoStreamingRequest;
}
