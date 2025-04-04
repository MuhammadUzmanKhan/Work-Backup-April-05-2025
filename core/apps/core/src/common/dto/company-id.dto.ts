import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CompanyIdQueryDto {
  @ApiProperty({
    description: 'Company Id',
  })
  @IsNumber()
  @Type(() => Number)
  company_id: number;
}
