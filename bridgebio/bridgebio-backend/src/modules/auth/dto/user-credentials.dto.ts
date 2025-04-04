import { REGEX, VALIDATION_MESSAGES } from "@common/constants";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Length, Matches } from "class-validator";

export class UserCredentials {
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({
        type: String,
        description: "Email",
        required: true
    })
    email: string;

    @IsNotEmpty()
    @Length(8, 24)
    @Matches(REGEX.PASSWORD_REGEX, { message: VALIDATION_MESSAGES.PASSWORD_REGEX_MESSAGE })
    @ApiProperty({
        type: String,
        description: "Password",
        required: true
    })
    password: string;
}