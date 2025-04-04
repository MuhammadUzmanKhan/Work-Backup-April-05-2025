import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class ReferenceMapDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Filter by incident zone name' })
  @IsOptional()
  @IsString()
  keyword: string;
}
