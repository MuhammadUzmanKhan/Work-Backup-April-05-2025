import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class AddUserProfileDto {
    @ApiProperty({
        type: String,
        description: 'This is a required property to add user profile.'
    })
    @IsString()
    @IsNotEmpty()
    location: string;

    @ApiProperty({
        type: String,
        description: 'This is a required property to add user profile.'
    })
    @IsUUID()
    @IsNotEmpty()
    colorThemeId: string;

    @ApiProperty({
        type: String,
        description: 'This is a required property to add user profile.'
    })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    categories: string[];
}
