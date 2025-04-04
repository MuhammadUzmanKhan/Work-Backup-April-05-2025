import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
@Injectable()
export class ErrorDto {
  @ApiProperty({
    type: String,
    description:
      "Error. This is required property to create an Error.",
  })
  @IsString()
  error: string;
}
