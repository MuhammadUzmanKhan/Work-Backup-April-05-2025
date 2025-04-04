import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Urls } from '../dto';

export class UploadSubtaskAttachmentDto extends EventIdQueryDto {
  @ApiProperty()
  @IsNumber()
  subtask_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Urls)
  eventSubtasksAttachments: Urls[];
}
