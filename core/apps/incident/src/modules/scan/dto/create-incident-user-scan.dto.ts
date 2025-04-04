import { IsEnum, IsNumber } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { ScanType } from '@Common/constants';

export class CreateIncidentUserScanDto extends EventIdQueryDto {
  @IsNumber()
  user_id: number;

  @IsNumber()
  department_id: number;

  @IsNumber()
  incident_id: number;

  @IsEnum(ScanType)
  scan_type: ScanType;
}
