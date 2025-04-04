import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
@Injectable()
export class LinkedinAccountCompanyDto {
  @ApiProperty({
    type: String,
    description:
      "Name. This is required property to create a LinkedinAccountCompany.",
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description:
      "Location. This is optional property to create a LinkedinAccountCompany.",
  })
  @IsString()
  @IsOptional()
  location?: string;

}
