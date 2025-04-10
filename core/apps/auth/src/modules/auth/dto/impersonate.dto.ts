import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class ImpersonateDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  id: number;
}
