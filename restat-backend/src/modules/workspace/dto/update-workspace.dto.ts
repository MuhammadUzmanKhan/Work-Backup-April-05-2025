import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUrl } from "class-validator";
import { ComapanySize } from "src/types/enum";

export class UpdateWorkspaceDto {


  @ApiProperty({
    type: String,
    description: 'This is a optional property to create company.'
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    type: String,
    description: 'This is a optional property to create company.'
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({
    type: String,
    description: 'This is a optional property to create company.'
  })
  @IsOptional()
  @IsString()
  colorThemeId?: string;

  @ApiProperty({
    type: String,
    description: 'This is a optional property to create company.'
  })
  @IsOptional()
  @IsString()
  categories?: string[];

  @ApiProperty({
    type: String,
    description: 'This is a optional property to create company.'
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    enum: ComapanySize,
    enumName: 'companySize',
    description: 'This is a required property to create company.',
    default: ComapanySize.JUST_ME,
  })
  @IsOptional()
  @IsEnum(ComapanySize, { each: true })
  companySize?: ComapanySize;
}
