import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString } from "class-validator";

export class JobAttributesDto {
  @ApiProperty({
    type: String,
    description: 'Experience level required for the job. This is a required property to create a job.',
  })
  @IsString()
  experienceLevel: string;

  @ApiProperty({
    type: String,
    description: 'Hourly range for the job. This is a required property to create a job.',
  })
  @IsString()
  hourlyRange: string;

  @ApiProperty({
    type: String,
    description: 'Number of hours per week for the job. This is a required property to create a job.',
  })
  @IsString()
  hourly: string;

  @ApiProperty({
    type: String,
    description: 'Duration of the project length for the job. This is a required property to create a job.',
  })
  @IsString()
  projectLengthDuration: string;

  @ApiProperty({
    type: String,
    description: 'Client proposed terms like his total budget for the job. This is a required property to create a job.',
  })
  @IsString()
  proposeYourTerms: string;

  @ApiProperty({
    type: Boolean,
    description: 'Flag indicating if the job is featured. This is a required property to create a job.',
  })
  @IsBoolean()
  featuredJob: boolean;
}
