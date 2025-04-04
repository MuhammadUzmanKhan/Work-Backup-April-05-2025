import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class DateFilterDto {
  @ApiPropertyOptional({
    description: 'Pass date in format 2024-01-07 as yyyy-mm-dd',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date is not valid or not in the correct format yyyy-mm-dd',
  })
  date!: string;
}

export class PriorityDto {
  @ApiPropertyOptional({
    description: 'Prority Check True | False',
  })
  @Transform(({ value }) => Boolean(JSON.parse(value)))
  @IsBoolean()
  @IsOptional()
  priority?: boolean;
}
