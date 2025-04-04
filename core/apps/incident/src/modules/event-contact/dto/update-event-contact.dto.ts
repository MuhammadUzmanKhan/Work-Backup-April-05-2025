import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  CompanyIdOptionalDto,
  EventIdQueryDto,
} from '@ontrack-tech-group/common/dto';

export class UpdateEventContactDto extends IntersectionType(
  EventIdQueryDto,
  CompanyIdOptionalDto,
) {
  @ApiPropertyOptional({ description: 'Pass title of Event Contact' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Title should not be empty' })
  title: string;

  @ApiPropertyOptional({ description: 'Pass first_name of Event Contact' })
  @IsOptional()
  @IsString()
  first_name: string;

  @ApiPropertyOptional({ description: 'Pass last_name of Event Contact' })
  @IsOptional()
  @IsString()
  last_name: string;

  @ApiPropertyOptional({ description: 'Pass name of Event Contact' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Pass contact_phone of Event Contact' })
  @IsOptional()
  @IsString()
  contact_phone: string;

  @ApiPropertyOptional({ description: 'Pass contact_email of Event Contact' })
  @IsOptional()
  @IsString()
  contact_email: string;

  @ApiPropertyOptional({ description: 'Pass country_code of Event Contact' })
  @IsOptional()
  @IsString()
  country_code: string;

  @ApiPropertyOptional({
    description: 'Pass country_iso_code of Event Contact',
  })
  @IsString()
  @IsOptional()
  country_iso_code: string;

  @ApiPropertyOptional({ description: 'Pass description of Event Contact' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'description should not be empty' })
  description: string;
}
