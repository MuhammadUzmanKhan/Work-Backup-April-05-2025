import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsUrl()
  git_url: string;

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
  @IsUrl()
  figma_link: string;

  @IsOptional()
  @IsUrl()
  pm_template: string;

  @IsString()
  tech_stack: string;

  @IsArray()
  frame_work_ids: number[];

  @IsArray()
  project_library_ids: string[];
}
