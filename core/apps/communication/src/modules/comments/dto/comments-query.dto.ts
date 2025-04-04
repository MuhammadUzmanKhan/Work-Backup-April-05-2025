import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentableTypes } from '@ontrack-tech-group/common/constants';
import { PaginationDto } from '@ontrack-tech-group/common/dto';

export class CommentsQueryParamsDto extends PaginationDto {
  @ApiProperty({ enum: CommentableTypes })
  @IsEnum(CommentableTypes)
  type: CommentableTypes;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  comment_id: number;
}
