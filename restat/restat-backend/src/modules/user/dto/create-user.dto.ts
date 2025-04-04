import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsString,
} from "class-validator";
import { IsEmail } from "class-validator";
import { ROLES } from "src/common/constants/roles";

export class CreateUserDto {
  
  @ApiProperty({
    type: String,
    description: "This is a required property to create the name.",
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: "This is a required property to create the email.",
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: ROLES,
    enumName: "portfolioType",
    description: "This is a required property to update the role.",
    default: ROLES.COMPANY_ADMIN,
  })
  @IsEnum(ROLES, { each: true })
  role: ROLES;
}