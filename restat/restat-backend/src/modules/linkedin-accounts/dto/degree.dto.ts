import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
@Injectable()
export class DegreeDto {
  @ApiProperty({
    type: String,
    description:
      "Name. This is required property to create a degree.",
  })
  @IsString()
  name: string;
}
