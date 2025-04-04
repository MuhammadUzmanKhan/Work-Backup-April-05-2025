import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetAllSubcompaniesByCompanyIdDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  id: number;
}
