import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsString,
} from "class-validator";
import { INTEGER } from "sequelize";
import { ROLES } from "src/common/constants/roles";

export class UpdateUserDto {
  @ApiProperty({
    type: String,
    description: "The user id.",
  })
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    description: "This is a required property to update the name.",
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: INTEGER,
    description: "Upwork Target",
  })
  @IsNumber()
  upworkTarget: number;

  @ApiProperty({
    type: INTEGER,
    description: "LinkedIn Target",
  })
  @IsNumber()
  linkedinTarget: number;

  @ApiProperty({
    enum: ROLES,
    enumName: "portfolioType",
    description: "This is a required property to update the role.",
    default: ROLES.COMPANY_ADMIN,
  })
  @IsEnum(ROLES, { each: true })
  role: ROLES;
}
