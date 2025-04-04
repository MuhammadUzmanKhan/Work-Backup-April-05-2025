import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, Min } from 'class-validator';

export class AddUserToMessageGroupDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  message_group_id: number;

  @ApiProperty()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  user_ids: number[];
}
