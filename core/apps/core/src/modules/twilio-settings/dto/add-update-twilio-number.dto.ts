import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';

export class AddTwilioNumberDto extends CompanyIdDto {
  @IsString()
  phone_number: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_enabled: boolean;
}

export class UpdateTwilioNumberDto {
  @IsString()
  @IsOptional()
  phone_number: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_enabled: boolean;
}
