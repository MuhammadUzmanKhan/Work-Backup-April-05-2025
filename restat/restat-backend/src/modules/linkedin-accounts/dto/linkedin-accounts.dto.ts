import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsArray, IsString, IsOptional, ValidateNested, IsNotEmpty } from "class-validator";
import { ContactInfoDto } from "./contact-info.dto";
import { EducationDto } from "./education.dto";
import { SkillsDto } from "./skills.dto";
import { ExperienceDto } from "./experience.dto";

export class LinkedinAccountsDto {
  @ApiProperty({
    type: String,
    description: 'LinkedIn Profile ID. This is required property to create a linkedin account.',
  })
  @IsNotEmpty()
  @IsString()
  bidProfile: string;

  @ApiProperty({
    type: String,
    description: 'Industry ID. This is required property to create a linkedin account.',
  })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Connection status. This is optional property to create a linkedin account.',
  })
  @IsBoolean()
  @IsOptional()
  isConnected?: boolean;

  @ApiProperty({
    type: String,
    description: 'Name. This is required property to create a linkedin account.',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Number of connections. This is optional property to create a linkedin account.',
  })
  @IsOptional()
  @IsString()
  connections: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Number of followers. This is optional property to create a linkedin account.',
  })
  @IsString()
  @IsOptional()
  followers: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Location. This is required optional to create a linkedin account.',
  })
  @IsString()
  @IsOptional()
  location: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Location Country. This is required optional to create a linkedin account.',
  })
  @IsString()
  @IsOptional()
  locationCountry: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Location State. This is required optional to create a linkedin account.',
  })
  @IsString()
  @IsOptional()
  locationState: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Profile headline. This is optional property to create a linkedin account.',
  })
  @IsString()
  @IsOptional()
  profileHeadline: string;

  @ApiProperty({ type: ContactInfoDto })
  @ValidateNested()
  contactInfo: ContactInfoDto;

  @ApiProperty({ type: Array, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  education: EducationDto[];

  @ApiProperty({ type: Array, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  skills: SkillsDto[];

  @ApiProperty({ type: Array, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  experience: ExperienceDto[];

  @ApiProperty({
    type: String,
    required: false,
    description: 'Profile Raw Html. This is optional property to create a linkedin account.',
  })
  @IsString()
  @IsOptional()
  rawHtml: string;
  
  @ApiProperty({
    type: String,
    required: false,
    description: 'ContactInfo PopupRawHtml Raw Html. This is optional property to create a linkedin account.',
  })
  @IsString()
  @IsOptional()
  contactInfoPopupRawHtml: string;

  @IsOptional()
  @IsString()
  monthStart?: string

  @IsOptional()
  @IsString()
  dayStart?: string

  @IsOptional()
  @IsString()
  dayEnd?: string
}
