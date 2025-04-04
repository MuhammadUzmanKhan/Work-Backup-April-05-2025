import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class SnoozeIncidentMessageCenterDto extends EventIdQueryDto {
  @IsOptional()
  @IsString()
  snooze_message: string;

  @IsOptional()
  @IsString()
  start_time: string;

  @IsOptional()
  @IsString()
  end_time: string;

  @IsBoolean()
  snooze: boolean;
}
