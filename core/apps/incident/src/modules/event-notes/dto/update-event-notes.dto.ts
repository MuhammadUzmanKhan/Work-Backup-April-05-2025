import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateEventNoteDto extends EventIdQueryDto {
  @IsOptional()
  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  unread: boolean;

  @IsOptional()
  @IsBoolean()
  is_broadcasted: boolean;

  @IsOptional()
  @IsBoolean()
  is_private: boolean;
}
