import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { SOURCE } from "src/common/constants/source";

export class UpdateProfileDto {
  @ApiProperty({
    type: String,
    description: 'The id of profile. This is a required property to update a Profile.',
  })
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    description: 'The name of profile. This is an optional property to update a Profile.',
  })
  @IsOptional()
  name?: string;

  @ApiProperty({
    type: String,
    description: 'The companyId of profile. This is an optional property to update a Profile.',
  })
  @IsOptional()
  companyId?: string;

  @ApiProperty({
    type: String,
    description: 'The url of profile. This is an optional property to update a Profile.',
  })
  @IsOptional()
  url?: string;

  @ApiProperty({
    type: String,
    description: 'The source of profile. This is an optional property to update a Profile.',
  })
  @IsOptional()
  source?: SOURCE;
}
