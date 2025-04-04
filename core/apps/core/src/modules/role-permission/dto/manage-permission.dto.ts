import { Type } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';

export class ManagePermissionsDto {
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  permission_ids: number[];

  @Type(() => Number)
  @IsNumber()
  role_id: number;
}
