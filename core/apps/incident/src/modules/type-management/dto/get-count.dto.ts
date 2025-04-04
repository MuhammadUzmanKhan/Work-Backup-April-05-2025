import { IsOptional, IsString } from 'class-validator';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCountDto extends CompanyIdDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;
}
