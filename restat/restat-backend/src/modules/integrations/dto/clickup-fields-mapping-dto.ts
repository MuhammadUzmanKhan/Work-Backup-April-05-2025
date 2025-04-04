import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";
import { CLICKUP_SUB_TYPES } from "src/common/constants/integrations";

export class CustomFieldDTO {
    @ApiProperty({
        description: 'Name of the custom field.',
    })
    @IsString()
    name: string;

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
    isStaticField?: boolean;

    // Hubpot
    @ApiProperty({
        description: 'Type of the property.',
    })
    @IsString()
    type?: string;

    @ApiProperty({
        description: 'Integration type. i.e UPWORK or LINKEDIN',
    })
    @IsString()
    integration: string;

    @ApiProperty({
        description: 'Label of the property on Hubspot.',
    })
    @IsString()
    label?: string;

    @ApiProperty({
        description: 'Flag indicating if the field is hubspot defined.',
    })
    @IsBoolean()
    hubspotDefined?: boolean;

    @ApiProperty({
        description: 'Category name on Hubspot. i.e DEALS, CONTACTS, COMPANIES',
    })
    @IsString()
    hubspotCategory?: string;

    @ApiProperty({
        description: 'Label of selected field on restat',
    })
    @IsString()
    valueName?: string;

    @ApiProperty({
        description: 'Flag indicating if the field value is Static.',
    })
    @IsBoolean()
    isStaticValue?: boolean;




}

export class ClickUpFieldsDTO {
    @ApiProperty({
        description: 'Array of custom fields.',
        type: [CustomFieldDTO],
    })
    @IsArray()
    @IsOptional()
    customFields: CustomFieldDTO[];

    @ApiProperty({
        description: 'Integration type. i.e UPWORK or LINKEDIN',
    })
    subType: CLICKUP_SUB_TYPES;
}
