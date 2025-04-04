import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetAllCompanyWeatherProviderDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Company id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id: number;
}
