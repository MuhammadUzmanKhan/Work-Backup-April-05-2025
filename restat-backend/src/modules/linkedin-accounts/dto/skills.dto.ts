import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
@Injectable()
export class SkillsDto {
  @ApiProperty({
    type: String,
    description:
      "Name. This is required property to create a linkedin account.",
  })
  @IsString()
  name: string;
}
