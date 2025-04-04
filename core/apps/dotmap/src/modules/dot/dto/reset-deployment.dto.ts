import { IsNumber, IsOptional } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class ResetDeploymentDto extends EventIdQueryDto {
  @IsNumber()
  @IsOptional()
  vendor_id: number;
}
