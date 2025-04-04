import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  CompanyIdDto,
  EventIdQueryOptionalDto,
} from '@ontrack-tech-group/common/dto';

export class GetAllVendorsDto extends IntersectionType(
  CompanyIdDto,
  EventIdQueryOptionalDto,
) {
  @ApiPropertyOptional({ description: 'To search through name of vendors.' })
  @IsOptional()
  @IsString()
  keyword: string;
}
