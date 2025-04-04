import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsArray, IsDateString, IsObject, IsString, IsOptional, IsUrl } from "class-validator";
import { STRING } from "sequelize";
import { BidQuestionsDto } from "src/modules/accounts/dto/accounts.dto";

export class BidDto {

  @ApiProperty({
    type: String,
    description: 'ID of job assocciated with Bid.',
  })
  @IsString()
  jobId: string;

  @ApiProperty({
    type: String,
    description: 'ID of contact assocciated with Bid.',
  })
  @IsString()
  contactId: string;

  @ApiProperty({
    type: String,
    description: 'The bid cover letter. This is a required property to create bid.',
  })
  @IsString()
  bidCoverLetter: string;

  @ApiProperty({
    type: String,
    description: 'The bid profile id. This is a required property to create bid.',
  })
  @IsString()
  bidProfile: string;

  @ApiProperty({
    type: String,
    description: 'The bid profile freelancer. This is an optional property to create bid.',
    required: false
  })
  @IsOptional()
  @IsString()
  bidProfileFreelancer?: string;

  @ApiProperty({
    type: String,
    description: 'The bid profile agency. This is an optional property to create bid.',
    required: false
  })
  @IsOptional()
  @IsString()
  bidProfileAgency?: string;

  @ApiProperty({
    type: String,
    description: 'The bid profile business manager. This is an optional property to create bid.',
    required: false
  })
  @IsOptional()
  @IsString()
  bidProfileBusinessManager?: string;

  @ApiProperty({
    type: String,
    description: 'The bid URL. This is a required property to create bid.',
  })
  @IsUrl()
  @IsString()
  bidURL: string;

  @ApiProperty({
    type: STRING,
    description: 'Number of connects. This is a required property to create bid.',
  })
  @IsString()
  connects: string;

  @ApiProperty({
    type: Boolean,
    description: 'Flag indicating if the bid is boosted. This is a required property to create bid.',
  })
  @IsBoolean()
  boosted: boolean;

  @ApiProperty({
    type: Object,
    description: 'Bid response with a single attribute as date of type dateTime. This is a required property to create bid.',
  })
  @IsObject()
  @IsOptional()
  response?: { date: Date };

  @ApiProperty({
    type: String,
    description: 'Bid time in dateTime format. This is a required property to create bid.',
  })
  @IsDateString()
  bidTime?: Date | string;

  @ApiProperty({
    type: Array,
    description: 'Array of bid questions. This is a required property to create bid.',
  })
  @IsArray()
  bidQuestions?: BidQuestionsDto[];

  @ApiProperty({
    type: String,
    description: 'Hourly range for the job. This is a required property to create bid.',
  })
  @IsString()
  rate: string;

  @ApiProperty({
    type: String,
    description: 'Received amount for the job. This is a required property to create bid.',
  })
  @IsString()
  receivedAmount: string;

  @ApiProperty({
    type: String,
    description: 'Profile for the job. This is a required property to create bid.',
  })
  @IsString()
  profile: string;

  @ApiProperty({
    type: Boolean,
    description: 'Response for the job proposal. This is a required property to create bid.',
  })
  @IsBoolean()
  bidResponse: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Invite for the job proposal. This is a required property to create bid.',
  })
  @IsBoolean()
  invite: boolean;

  @ApiProperty({
    type: String,
    description: 'Job Object Id. This is a required property to create bid.',
  })
  @IsString()
  jobObjId: string;

  @ApiProperty({
    type: String,
    description: 'CreatedAt time in dateTime format. This is a required property to create bid.',
  })
  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    type: String,
    description: 'UpdatedAt in dateTime format. This is a required property to create bid.',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: Date;

  @ApiProperty({
    type: Boolean,
    description: 'Invite for the job proposal. This is a required property to create bid.',
  })
  @IsBoolean()
  @IsOptional()
  migratedData?: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Flag indicating if the bid is manual. Defaults to false.',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isManual?: boolean;

  @ApiProperty({
    type: String,
    description: 'Lead date in dateTime format.',
    required: false
  })
  @IsDateString()
  @IsOptional()
  contractDate?: Date;

  @ApiProperty({
    type: String,
    description: 'To add job Title from a manually created form',
  })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({
    type: String,
    description: 'To add job Title from a manually created form',
  })
  @IsString()
  @IsOptional()
  userName?: string;
}
