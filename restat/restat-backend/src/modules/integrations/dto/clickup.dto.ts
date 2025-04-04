import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
@Injectable()
export class ClickupDTO {
    @ApiProperty({
        type: String,
        description:
            "Code. This is required property to authenticate clickup..",
    })
    @IsString()
    code: string;
}
