import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStaffDto {
  @IsOptional()
  @IsString()
  qr_code!: string;

  @IsOptional()
  @IsString()
  checked_in!: string;

  @IsOptional()
  @IsString()
  checked_out!: string;

  @IsOptional()
  @IsString()
  pos!: string;

  @IsNumber()
  rate!: number;

  @IsOptional()
  @IsBoolean()
  is_flagged!: boolean;

  @IsNumber()
  vendor_id!: number;

  @IsNumber()
  vendor_position_id!: number;

  @IsNumber()
  shift_id!: number;
}
