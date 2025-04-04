import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { ROLES } from "src/common/constants/roles";

class Member {
  @ApiProperty({
    type: String,
    description: 'This is a required property to send invite.'
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'This is a required property to send invite.'
  })
  @IsEmail()
  email: string;

  @IsOptional()
  @ApiProperty({
    type: Number,
    description: 'Upwork Target of user'
  })
  upworkTarget: number;

  @IsOptional()
  @ApiProperty({
    type: Number,
    description: 'Linkedin Target of user'
  })
  linkedinTarget: number;

  @ApiProperty({
    enum: ROLES,
    enumName: 'roles',
    description: 'This is a required property to send invite.',
    default: ROLES.BIDDER,
  })
  @IsEnum(ROLES)
  role: ROLES;
}
export class SendInvitationDto {
  @ApiProperty({
    type: Array<Member>,
    description: 'This is a required property to send invite.'
  })
  @ValidateNested()
  @Type(() => Member)
  members: Member[]

}


