import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateTemplateDto extends EventIdQueryDto {
  @ApiProperty()
  @IsString()
  logo_url: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Description should not be empty' })
  description: string;

  @ApiProperty()
  @IsString()
  ticket_image_url: string;

  @ApiProperty()
  @IsString()
  faq_url: string;

  @ApiProperty()
  @IsString()
  footer_text: string;

  @ApiProperty()
  @IsString()
  banner_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 30)
  @Matches(/^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*$/)
  slug: string;
}
