import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MessageGroupableType } from '@ontrack-tech-group/common/constants';

export class GetMessageGroupsByEventDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiProperty()
  @IsEnum(MessageGroupableType)
  group_type: MessageGroupableType;
}
