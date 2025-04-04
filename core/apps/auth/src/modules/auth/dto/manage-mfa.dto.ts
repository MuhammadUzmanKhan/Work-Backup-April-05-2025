import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class ManageMfaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  user_id: number;
}
