import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { SOURCE } from "src/common/constants/source";

export class ProfileDto {
  @ApiProperty({
    type: String,
    description: 'The name of profile. This is a required property to create a Profile.',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'The url of profile. This is a required property to create a Profile.',
  })
  @IsString()
  url: string;

  @ApiProperty({
    type: String,
    description: 'The source of profile. This is a required property to create a Profile.',
  })
  @IsString()
  source: SOURCE;
}
