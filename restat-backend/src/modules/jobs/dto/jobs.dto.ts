import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsUrl,
  IsBoolean,
  IsOptional,
} from "class-validator";
import { JobAttributesDto } from "./job-attributes.dto";

export class JobDto {
  @ApiProperty({
    type: String,
    description: "Title of the job. This is a required property to create a job.",
  })
  @IsString()
  jobTitle: string;

  @ApiProperty({
    type: String,
    description: "Categories of the job. This is a required property to create a job.",
  })
  @IsString()
  jobCategories: string;

  @ApiProperty({
    type: String,
    description: "Description of the job. This is a required property to create a job.",
  })
  @IsString()
  jobDescription: string;

  @ApiProperty({
    type: String,
    description: "Connects of the job. This is a required property to create a job.",
  })
  @IsOptional()
  @IsString()
  jobConnects?: string;

  @ApiProperty({
    type: [String],
    description: "Skills required for the job. This is a required property to create a job.",
  })
  @IsString({ each: true })
  jobSkills: string[];

  @ApiProperty({
    type: JobAttributesDto,
    description: "Attributes of the job. This is a required property to create a job.",
  })
  @ValidateNested()
  jobAttributes: JobAttributesDto;

  @ApiProperty({
    type: String,
    description: "Date when the job was posted. This is a required property to create a job.",
  })
  @IsDateString()
  jobPosted: string;

  @ApiProperty({
    type: String,
    description: "URL of the job. This is a required property to create a job.",
  })
  @IsUrl()
  @IsNotEmpty()
  jobURL: string;

  // @ApiProperty({
  //   type: String,
  //   description: "This is a required property to add job. This is a required property to create a job.",
  // })
  // @IsString({ each: true })
  // @ArrayMinSize(1)
  // tags?: string[];

  @ApiProperty({
    type: Boolean,
    description: 'Flag indicating if the job is invite only. This is a required property to create a job.',
  })
  @IsBoolean()
  inviteOnly: boolean;

  @ApiProperty({
    type: String,
    description: 'CreatedAt time in dateTime format. This is a required property to create job.',
  })
  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    type: String,
    description: 'UpdatedAt in dateTime format. This is a required property to create jon.',
  })
  @IsDateString()
  @IsOptional()
  updatedAt?: Date;
}
