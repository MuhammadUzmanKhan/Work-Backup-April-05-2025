import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { ERRORS } from '@ontrack-tech-group/common/constants';

export class AddCommentDto extends EventIdQueryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: ERRORS.COMMENT_CANNOT_BE_EMPTY })
  text: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  user_ids: number[];
}
