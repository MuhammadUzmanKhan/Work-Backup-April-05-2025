import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { ROLES } from "src/common/constants/roles";

export class UpdateUserRoleDto {
  @ApiProperty({
    type: String,
    description: 'The user id.',
  })
  @IsString()
  id: string;

  @ApiProperty({
    enum: ROLES,
    enumName: 'portfolioType',
    description: 'This is a required property to update the role.',
    default: ROLES.COMPANY_ADMIN,
  })
  @IsEnum(ROLES, { each: true })
  role: ROLES;
}
