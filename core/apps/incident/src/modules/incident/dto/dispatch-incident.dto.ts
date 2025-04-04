import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class DispatchIncidentDto extends EventIdQueryDto {
  @IsNumber()
  incident_id!: number;

  @IsArray()
  @ValidateNested()
  @Type(() => DepartmentStaffDto)
  department_staff!: DepartmentStaffDto[];
}

export class DepartmentStaffDto {
  @IsNumber()
  user_id!: number;

  @IsNumber()
  department_id!: number;
}
