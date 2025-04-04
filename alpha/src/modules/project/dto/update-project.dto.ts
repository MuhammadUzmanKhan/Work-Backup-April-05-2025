import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsUrl()
  git_url: string;

  @IsOptional()
  @IsUrl()
  figma_link: string;

  @IsOptional()
  @IsUrl()
  pm_template: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @IsISO8601()
  start_date: Date;

  @IsOptional()
  @IsString()
  @IsISO8601()
  endDate: Date;

  @IsOptional()
  @IsUrl()
  audit_report: string;

  @IsOptional()
  tech_stack: string;

  @IsOptional()
  @IsArray()
  frame_work_ids: number[];

  @IsOptional()
  @Type(() => String)
  project_library_ids: string[];
}
