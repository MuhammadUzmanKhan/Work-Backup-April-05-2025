import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CommentableTypes } from '@ontrack-tech-group/common/constants';
import { PaginationDto } from '@ontrack-tech-group/common/dto';

export class CommentsQueryParamsDto extends PaginationDto {
  @ApiProperty()
  @IsEnum(CommentableTypes)
  type: CommentableTypes;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  // @ApiPropertyOptional() // TODO for other modules in future
  // @IsOptional()
  @ApiProperty({ description: 'Commentable id i.e user id' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;
}
