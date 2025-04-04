import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';

export class TaskCategoryQueryDto extends CompanyIdDto {
  @ApiPropertyOptional({
    description: 'Search a Task Category by Name',
  })
  @IsOptional()
  @IsString()
  keyword: string;
}
