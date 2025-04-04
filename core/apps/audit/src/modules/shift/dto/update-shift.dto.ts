import { IsOptional, IsString } from 'class-validator';

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  start_date!: string;

  @IsOptional()
  @IsString()
  end_date!: string;
}
