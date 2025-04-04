import { TemplateType } from '@Common/constants';
import { IsEnum, IsNotEmptyObject, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsEnum(TemplateType)
  type: TemplateType;

  @IsNotEmptyObject()
  @IsObject()
  config: Record<string, any>;
}
