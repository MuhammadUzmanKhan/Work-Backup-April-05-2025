import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGlobalIncidentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Color should not be empty' })
  color: string;

  @IsOptional()
  @IsBoolean()
  pinned: boolean;

  @IsOptional()
  @IsBoolean()
  archived: boolean;
}
