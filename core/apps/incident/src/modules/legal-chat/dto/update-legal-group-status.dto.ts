import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LegalGroupStatusEnum } from '@ontrack-tech-group/common/constants';

export class UpdateLegalGroupStatusDto {
  @ApiProperty({
    description: 'Status of the Legal Group',
    enum: LegalGroupStatusEnum,
  })
  @IsEnum(LegalGroupStatusEnum)
  @IsNotEmpty()
  status: LegalGroupStatusEnum;

  @IsOptional()
  @IsBoolean()
  is_archived!: boolean;

  @IsOptional()
  @IsBoolean()
  is_concluded!: boolean;
}
