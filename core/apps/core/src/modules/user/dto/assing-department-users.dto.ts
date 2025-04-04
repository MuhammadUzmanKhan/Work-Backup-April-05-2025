import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, Min } from 'class-validator';

export class AssignDepartmentDivisionUserDto {
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  users_ids: number[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  division_ids: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;
}
