import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class PathParamDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  id: number;
}
