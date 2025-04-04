import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/swagger';
import { CsvOrPdfDto, RegionIdDto } from '@ontrack-tech-group/common/dto';
import { CompanyCategoryType } from '@Common/constants';
import { GetCompanyDto } from './get-company.dto';
import { Transform } from 'class-transformer';

export class CompanySubcompanyFilterDto extends IntersectionType(
  GetCompanyDto,
  CsvOrPdfDto,
  RegionIdDto,
) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  company_id: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subcompany_id: string;

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
