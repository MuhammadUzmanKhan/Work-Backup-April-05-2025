import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetAllWeatherProviderDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Company id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id: number;

  @ApiPropertyOptional({ description: 'Search By Provider Name' })
  @IsOptional()
  @IsString()
  keyword: string;
}
