import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryOptionalDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetDepartmentNamesByEventDto extends EventIdQueryOptionalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  company_id: number;
}
