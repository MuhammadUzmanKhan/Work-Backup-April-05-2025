import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FRAMEWORKS } from 'src/common/constants/enum';

export class GetAllProjectsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(FRAMEWORKS)
  framework: FRAMEWORKS;
}
