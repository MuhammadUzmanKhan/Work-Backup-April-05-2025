import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
@Injectable()
export class TitleDto {
  @ApiProperty({
    type: String,
    description:
      "Title. This is required property to create a linkedin account.",
  })
  @IsString()
  title: string;

  @ApiProperty({
    type: String,
    description:
      "Duration. This is optional property to create a linkedin account.",
    required: false,
  })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({
    type: String,
    description:
      "Location. This is optional property to create a linkedin account.",
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;
}
