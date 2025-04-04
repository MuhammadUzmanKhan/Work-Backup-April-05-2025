import { ApiProperty } from "@nestjs/swagger";

export class CreateExtensionReleaseDto {
    @ApiProperty({
        type: String,
        description: 'This is a required property to create extension release.'
    })
    version: string;

    @ApiProperty({
        type: String,
        description: 'This is a required property to create extension release.'
    })
    message: string;

    @ApiProperty({
        type: Boolean,
        description: 'This is a required property to create extension release.'
    })
    forced?: boolean;
}
