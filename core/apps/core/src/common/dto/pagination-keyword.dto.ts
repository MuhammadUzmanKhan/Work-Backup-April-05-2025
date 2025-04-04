import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@ontrack-tech-group/common/dto';

export class PaginationAndKeywordDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search on based of name' })
  @IsOptional()
  @IsString()
  keyword: string;
}
