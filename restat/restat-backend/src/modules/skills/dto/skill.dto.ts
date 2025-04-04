import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
@Injectable()
export class SkillDto {
  @ApiProperty({
    type: String,
    description:
      "Name. This is required property to create a skill.",
  })
  @IsString()
  name: string;


}
