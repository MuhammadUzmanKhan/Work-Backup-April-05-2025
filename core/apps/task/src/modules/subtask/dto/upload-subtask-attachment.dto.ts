import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Urls } from './create-subtask.dto';

export class UploadSubtaskAttachmentDto {
  @IsNumber()
  subtask_id: number;

  @IsNumber()
  parent_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Urls)
  subtasksAttachments: Urls[];
}
