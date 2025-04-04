import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { TitleDto } from "src/modules/linkedin-accounts/dto/title.dto";
@Injectable()
export class ExperienceEntityDto {
  @ApiProperty({
    type: String,
    description:
      "Duration. This is required property to create an experience entity.",
  })
  @IsString()
  duration: string;

  @ApiProperty({
    type: String,
    description:
      "Duration. This is optional property to create an experience entity.",
      required: false
  })
  @IsString()
  @IsOptional()
  totalDuration?: string;

  @ApiProperty({
    type: String,
    description:
      "Title. This is required property to create an experience entity.",
  })
  @IsString()
  title: string | TitleDto[];

  @ApiProperty({
    type: String,
    description:
      "LinkedinAccount Id. This is required property to create an experience entity.",
  })
  @IsString()
  linkedinAccountId: string;

  @ApiProperty({
    type: String,
    description:
      "LinkedinAccountCompany Id. This is required property to create an experience entity.",
  })
  @IsString()
  linkedinAccountCompanyId: string;

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
}
