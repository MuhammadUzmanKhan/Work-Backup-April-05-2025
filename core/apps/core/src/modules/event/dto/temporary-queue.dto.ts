import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateTemporaryEventDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  delay: number;
}
