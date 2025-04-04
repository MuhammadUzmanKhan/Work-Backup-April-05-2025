import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CompanyIdDto {
  @ApiProperty({
    description: 'Company Id',
  })
  @IsNumber()
  @Type(() => Number)
  company_id: number;
}

export class CompanyIdOptionalDto {
  @ApiPropertyOptional({
    description: 'Company Id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  company_id: number;
}

export class CompanyIdsBodyDto {
  @ApiProperty({
    description: 'Company Ids',
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'Company Ids List should not be empty' })
  company_ids: number[];
}
