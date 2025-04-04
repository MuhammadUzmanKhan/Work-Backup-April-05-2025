import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
@Injectable()
export class EducationDto {
  @ApiProperty({
    type: String,
    description:
      "Name. This is required property to create a linkedin account.",
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description:
      "Degree. This is optional property to create a linkedin account.",
    required: false,
  })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiProperty({
    type: String,
    description:
      "Duration. This is optional property to create a linkedin account.",
    required: false,
  })
  @IsOptional()
  @IsString()
  duration?: string;
}
