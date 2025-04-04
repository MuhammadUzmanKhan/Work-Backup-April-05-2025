import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetDispatchLogsDto {
  @ApiPropertyOptional({
    description: 'Search by first_name, last_name or name',
  })
  @IsOptional()
  @IsString()
  keyword!: string;
}
