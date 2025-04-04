import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'Title should not be empty' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Description should not be empty' })
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ticket_image_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faq_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footer_text: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 30)
  @Matches(/^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*$/)
  slug: string;
}
