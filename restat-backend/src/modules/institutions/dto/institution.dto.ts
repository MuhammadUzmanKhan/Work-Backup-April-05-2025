import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
@Injectable()
export class InstitutionDto {
  @ApiProperty({
    type: String,
    description:
      "Name. This is required property to create an institution.",
  })
  @IsString()
  name: string;

}
