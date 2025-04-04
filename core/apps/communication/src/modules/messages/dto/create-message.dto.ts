import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MessageReceiverTypes } from '@ontrack-tech-group/common/constants';

export class CreateMessageDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  receiver_id: number;

  @ApiProperty()
  @IsEnum(MessageReceiverTypes)
  receiver_type: MessageReceiverTypes;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString({}, { message: 'Cell must be numeric only' })
  to_number: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString({}, { message: 'Cell must be numeric only' })
  from_number: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country_code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country_iso_code: string;
}
