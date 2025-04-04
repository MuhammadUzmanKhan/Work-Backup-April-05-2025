import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyIdOptionalDto } from '@ontrack-tech-group/common/dto';

export class GetIncidentLegalCountDto extends CompanyIdOptionalDto {
  @ApiPropertyOptional({
    description:
      'Search by description, locator code, staff name, incident type and id',
  })
  @IsOptional()
  @IsString()
  keyword!: string;
}
