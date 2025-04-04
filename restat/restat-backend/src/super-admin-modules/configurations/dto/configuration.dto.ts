import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, ValidateNested, IsOptional } from "class-validator";
import { Type } from "class-transformer";

// Define an interface for the Features object
class FeaturesDto {
    @ApiProperty({
        type: Boolean,
        description: "Flag for ClickUp integration.",
    })
    @IsBoolean()
    clickUp: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for HubSpot integration.",
    })
    @IsBoolean()
    hubSpot: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for Upwork integration.",
    })
    @IsBoolean()
    upwork: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for dashboard feature.",
    })
    @IsBoolean()
    dashboard: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for settings feature.",
    })
    @IsBoolean()
    settings: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for Upwork profiles feature.",
    })
    @IsBoolean()
    upworkProfiles: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for team feature.",
    })
    @IsBoolean()
    team: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for accounts feature.",
    })
    @IsBoolean()
    contacts: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for accounts feature.",
    })
    @IsBoolean()
    contactUs: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for stripe feature.",
    })
    @IsBoolean()
    stripe: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for deals feature.",
    })
    @IsBoolean()
    deals: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for companies feature.",
    })
    @IsBoolean()
    companies: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for business data feature.",
    })
    @IsBoolean()
    businessData: boolean;

    @ApiProperty({
        type: Boolean,
        description: "Flag for portfolios feature.",
    })
    @IsBoolean()
    portfolios: boolean;
}

// Main DTO class
@Injectable()
export class ConfigurationDto {

    @ApiProperty({
        type: String,
        nullable: true,
        description: "Company ID associated with the configuration.",
    })
    @IsOptional()
    companyId: string | null;

    @ApiProperty({
        type: FeaturesDto,
        description: "Features configuration.",
    })
    @ValidateNested()
    @Type(() => FeaturesDto)
    features: FeaturesDto;

}
