import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CsvOrPdfDto } from '@ontrack-tech-group/common/dto';
import { CompanyCategoryType } from '@Common/constants';
import { GetCompanyDto } from './get-company.dto';

export class SubcompaniesWithEvents extends IntersectionType(
  GetCompanyDto,
  CsvOrPdfDto,
) {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  company_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  subCompany_id: number;
}

export class SubcompaniesWithEventsAndCategory extends SubcompaniesWithEvents {
  @ApiPropertyOptional({
    description:
      'Category can be a list of either of these values. i.e. venues, festivals, demo, standard',
  })
  @IsOptional()
  @IsEnum(CompanyCategoryType, { each: true })
  category: CompanyCategoryType[];

  @ApiPropertyOptional({
    description:
      'If you want to show only Demo then send true, it will return all the demo companies',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  demo_company: boolean;
}
