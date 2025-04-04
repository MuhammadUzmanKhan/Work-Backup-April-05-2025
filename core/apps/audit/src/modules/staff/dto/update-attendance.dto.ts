import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateAttendanceMobileDto extends EventIdQueryDto {
  @IsString()
  qr_code!: string;

  @IsNumber()
  vendor_id!: number;

  @IsNumber()
  vendor_position_id!: number;

  @IsNumber()
  shift_id!: number;
}

export class UpdateAttendanceDto extends EventIdQueryDto {
  @IsOptional() // TODO: Will remove optional
  @IsString()
  @IsNotEmpty({ message: 'QR code should not be empty' })
  qr_code!: string;

  @IsOptional()
  @IsBoolean()
  shift_align!: boolean;

  @IsOptional() // TODO: Will remove optional
  @IsNumber()
  @ValidateIf((obj) => !!obj.shift_align)
  shift_id!: number;
}
