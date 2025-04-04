import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { SOURCE } from "src/common/constants/source";
@Injectable()
export class SettingsDto {
  @ApiProperty({
    type: Boolean,
    description:
      "AutoClose. This is an optional property to create a Setting.",
  })
  @IsBoolean()
  @IsOptional()
  autoClose: boolean;

  @ApiProperty({
    type: String,
    description:
      "Default Tab. This is optional property to create a Setting.",
  })
  @IsOptional()
  @IsString()
  defaultTab: SOURCE;

  @ApiProperty({
    type: Number,
    description:
      "Session Timeout. This is optional property to create a Setting.",
  })
  @IsOptional()
  @IsNumber()
  sessionTimeout: number;

  @ApiProperty({
    type: String,
    description:
      "Company Id. This is optional property to create a Setting.",
  })
  @IsOptional()
  @IsString()
  companyId: string;
}
