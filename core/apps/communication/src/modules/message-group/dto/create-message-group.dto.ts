import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateMessageGroupDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;

  @ApiProperty()
  @IsString()
  name: string;
}
