import { TaskIdQueryParamDto } from '@Common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class RemoveSubtaskAttachmentsDto extends TaskIdQueryParamDto {
  @ApiProperty({ description: 'Attachment Ids of Subtask' })
  @IsArray()
  @IsNumber({}, { each: true })
  attachment_ids: number[];
}
