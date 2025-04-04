import { IsNumber, IsOptional } from 'class-validator';

export class RemoveIncidentDepartmentDto {
  @IsNumber()
  incident_id!: number;

  @IsOptional()
  @IsNumber()
  user_incident_department_id!: number; //TODO: user_incident_department_id will be deleted

  @IsOptional() //TODO: will remove is optional
  @IsNumber()
  user_id!: number;
}
