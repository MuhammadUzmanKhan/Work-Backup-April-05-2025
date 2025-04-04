import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
@Injectable()
export class EducationEntityDto {
  @ApiProperty({
    type: String,
    description:
      "Duration. This is required property to create an education entity.",
  })
  @IsString()
  duration: string;

  @ApiProperty({
    type: String,
    description:
      "Degree. This is required property to create an education entity.",
  })
  @IsString()
  degree: string;

  @ApiProperty({
    type: String,
    description:
      "LinkedinAccount Id. This is required property to create an education entity.",
  })
  @IsString()
  contactId: string;

  @ApiProperty({
    type: String,
    description:
      "Institution Id. This is required property to create an education entity.",
  })
  @IsString()
  institutionId: string;
}
