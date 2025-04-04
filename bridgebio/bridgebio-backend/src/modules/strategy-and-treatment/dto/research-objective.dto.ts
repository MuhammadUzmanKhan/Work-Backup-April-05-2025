import {
    IsNotEmpty,
    IsBoolean,
    IsString,
    IsUUID,
    IsOptional
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResearchObjectiveDto {
    @ApiPropertyOptional({
        description: 'Add id for research Objective',
        example: '6ec0994f-f556-4445-aca0-2d85256537c6'
    })
    @IsUUID()
    @IsOptional()
    id?: string;

    @ApiPropertyOptional({
        description: 'Icon URL or path',
        example: 'https://example.com/icon.png'
    })
    @IsString()
    icon: string;

    @ApiProperty({
        description: 'Title of the research objective',
        example: 'Effects of Drug A on Blood Pressure'
    })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiPropertyOptional({
        description: 'Description of the research objective',
        example: 'This objective aims to assess the impact of Drug A on patients.'
    })
    @IsString()
    description: string;

    @ApiProperty({
        description: 'Published status',
        example: true
    })
    @IsNotEmpty()
    @IsBoolean()
    published: boolean;
}
