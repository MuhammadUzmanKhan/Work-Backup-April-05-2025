import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
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
}
