import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class UpworkProfileFields {
    @ApiProperty({
        description: 'id of the clickup profile.',
    })
    @IsNumber()
    id: number;

    @ApiProperty({
        description: 'id of the profile.',
    })
    @IsNumber()
    profileId: number;

    @ApiProperty({
        description: 'Username of the clickup profile.',
    })
    @IsNumber()
    username: string;

    @ApiProperty({
        description: 'Email of the clickup profile.',
    })
    @IsNumber()
    email: string;

    @ApiProperty({
        description: 'Name of the custom field on ClickUp.',
    })
    @IsString()
    customFieldName: string;

    @ApiProperty({
        description: 'Key of the custom field.',
    })
    @IsString()
    key: string;

    @ApiProperty({
        description: 'profilePicture of the custom field.',
    })
    @IsString()
    profilePicture: string;

    @ApiProperty({
        description: 'Value of the custom field.',
    })
    @IsString()
    value: string;

    @ApiProperty({
        description: 'Flag indicating if the value is blank.',
    })
    @IsBoolean()
    isBlank: boolean;

    @ApiProperty({
        description: 'Flag indicating if the field is required.',
    })
    @IsBoolean()
    required: boolean;

    @ApiProperty({
        description: 'Flag indicating if the field is static.',
    })
    @IsBoolean()
    @IsOptional()
    isStaticField?: boolean;
}

export class UpworkProfileDTO {
    @ApiProperty({
        description: 'Array of UpworkProfileFields.',
        type: [UpworkProfileFields],
    })
    @IsArray()
    profiles: UpworkProfileFields[];
}
