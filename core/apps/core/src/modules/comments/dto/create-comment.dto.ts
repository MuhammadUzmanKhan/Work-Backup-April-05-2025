import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { CommentableTypes } from '@ontrack-tech-group/common/constants';

export class CreateCommentDto {
  @ApiProperty()
  @IsEnum(CommentableTypes)
  commentable_type: CommentableTypes;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  commentable_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiProperty()
  @IsString()
  text: string;
}
