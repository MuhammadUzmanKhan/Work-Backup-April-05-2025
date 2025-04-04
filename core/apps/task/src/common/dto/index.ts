import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';

export class TaskIdQueryParamDto {
  @ApiProperty({ description: 'Parent Id of Subtask' })
  @IsNumber()
  @Type(() => Number)
  parent_id: number;
}

export class AttachmentIdPathParamDto {
  @ApiProperty({
    description: 'Attachment Id of an attachment as a path param',
  })
  @Type(() => Number)
  @IsNumber()
  attachment_id: number;
}

export class RemoveAttachmentDto extends IntersectionType(
  PathParamIdDto,
  AttachmentIdPathParamDto,
) {}
