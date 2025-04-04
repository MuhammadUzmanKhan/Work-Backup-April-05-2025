import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class AssignDepartmentWithEventDto extends EventIdQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  user_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  department_id: number;
}
