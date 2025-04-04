import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePresetDto, PresetFiltersDto } from './create-preset.dto';

export class UpdatePresetDto extends PartialType(
  OmitType(CreatePresetDto, ['name', 'filters'] as const),
) {
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  name?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PresetFiltersDto)
  filters?: PresetFiltersDto;
}
