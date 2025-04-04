import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateIncidentConversationDto extends EventIdQueryDto {
  @IsOptional()
  @IsString()
  color: string;

  @IsOptional()
  @IsBoolean()
  pinned: boolean;

  @IsOptional()
  @IsBoolean()
  archived: boolean;

  @IsOptional()
  @IsBoolean()
  concluded: boolean;

  @IsOptional()
  @IsBoolean()
  unread: boolean;
}
