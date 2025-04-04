import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, ValidateNested, IsOptional } from "class-validator";
import { TitleDto } from "./title.dto";

export class ExperienceDto {
  @ApiProperty({
    type: String,
    description:
      "Company Name. This is required property to create a linkedin account.",
  })
  @IsString()
  company: string;

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

  @ApiProperty({ type: Array, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  title?: TitleDto[] | string;
}
