import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateEventNoteDto extends EventIdQueryDto {
  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  is_weather_log: boolean;
}
