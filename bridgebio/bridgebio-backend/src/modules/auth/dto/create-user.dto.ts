import {
    IsNotEmpty,
    IsString
} from "class-validator";
import { UserCredentials } from "./user-credentials.dto";
import { Permissions} from "@common/types";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterUserDto extends UserCredentials {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        type: String,
        description: "Name",
        required: true
    })
    name: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        type: Object,
        description: "Permissions",
        required: true
    })
    permissions: Permissions;
}
