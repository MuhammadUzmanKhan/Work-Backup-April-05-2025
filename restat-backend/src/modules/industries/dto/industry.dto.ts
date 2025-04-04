import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class IndustryDto {
  @ApiProperty({
    type: String,
    description: 'The name of industry. This is a required property to create an Industry.',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'The description of industry. This is a required property to create an Industry.',
  })
  @IsString()
  @IsOptional()
  description: string;
}
