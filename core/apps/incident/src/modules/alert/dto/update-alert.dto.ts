import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateAlertDto extends EventIdQueryDto {
  @ApiPropertyOptional({
    description: 'Pass true for enable sms alert',
  })
  @IsOptional()
  @IsBoolean()
  sms_alert: boolean;

  @ApiPropertyOptional({
    description: 'Pass true for enable email alert',
  })
  @IsOptional()
  @IsBoolean()
  email_alert: boolean;
}
