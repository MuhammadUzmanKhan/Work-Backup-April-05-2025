import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class RemoveImageDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  image_id!: number;
}
