import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomMessageGroupDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color_code: string;
}
