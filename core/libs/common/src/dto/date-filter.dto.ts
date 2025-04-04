import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class DateFilterDto {
  @ApiPropertyOptional({
    description: 'Pass date of the day. Format: YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date is not valid or not in the correct format yyyy-mm-dd',
  })
  date: Date;
}

export class DateMultipleFilterDto {
  @ApiPropertyOptional({
    description:
      'Pass Sing;Multiple dates. FORMAT -> YYYY-MM-DD like dates=2024-10-10&dates=2024-10-11',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date is not valid or not in the correct format yyyy-mm-dd',
    each: true,
  })
  dates: Date[];
}
