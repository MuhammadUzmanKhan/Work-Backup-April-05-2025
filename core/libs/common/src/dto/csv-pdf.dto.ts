import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  Equals,
  IsString,
  ValidateIf,
} from 'class-validator';
import { CsvOrPdf } from '../constants';

export class CsvOrPdfDto {
  @ApiPropertyOptional({
    description: 'Pass CSV or PDF',
    enum: CsvOrPdf,
  })
  @IsOptional()
  @IsEnum(CsvOrPdf)
  csv_pdf: CsvOrPdf;

  @ApiPropertyOptional()
  @IsString()
  @ValidateIf((o) => o.csv_pdf === CsvOrPdf.PDF)
  file_name: string;
}

export class CsvDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Equals(CsvOrPdf.CSV)
  csv: string;
}

export class PdfDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Equals(CsvOrPdf.PDF)
  pdf: string;

  @ApiPropertyOptional()
  @IsString()
  @ValidateIf((o) => o.pdf !== undefined)
  file_name: string;
}
