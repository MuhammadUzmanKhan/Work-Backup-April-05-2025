import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteTaskDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  id: number;
}
