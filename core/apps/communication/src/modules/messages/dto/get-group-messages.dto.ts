import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '@ontrack-tech-group/common/dto';

export class GetGroupMessagesDto extends PaginationDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  message_group_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;
}
