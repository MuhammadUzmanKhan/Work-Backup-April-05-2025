import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsObject()
  config: Record<string, any>;
}
