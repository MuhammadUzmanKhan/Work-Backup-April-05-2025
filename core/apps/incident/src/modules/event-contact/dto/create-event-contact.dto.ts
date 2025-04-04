import { IsString, IsOptional } from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateEventContactDto extends IntersectionType(EventIdQueryDto) {
  @ApiPropertyOptional({ description: 'Pass title of Event Contact' })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Pass first_name of Event Contact' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Pass last_name of Event Contact' })
  @IsString()
  last_name: string;

  @ApiPropertyOptional({ description: 'Pass contact_name of Event Contact' })
  @IsOptional()
  @IsString()
  contact_name: string;

  @ApiPropertyOptional({ description: 'Pass name of Event Contact' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Pass city of Event Contact' })
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty({ description: 'Pass contact_phone of Event Contact' })
  @IsString()
  contact_phone: string;

  @ApiProperty({ description: 'Pass contact_email of Event Contact' })
  @IsString()
  contact_email: string;

  @ApiProperty({ description: 'Pass country_code of Event Contact' })
  @IsString()
  country_code: string;

  @ApiProperty({ description: 'Pass country_iso_code of Event Contact' })
  @IsString()
  country_iso_code: string;

  @ApiProperty({ description: 'Pass description of Event Contact' })
  @IsString()
  description: string;
}
