import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetStaffDetailByQrcodeDto extends EventIdQueryDto {
  @ApiProperty({ description: 'QR code to search' })
  @IsString()
  qr_code!: string;
}
