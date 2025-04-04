import {
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsString,
    IsUUID,
    IsArray,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidateNested
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ResearchObjectiveDto } from './research-objective.dto';

@ValidatorConstraint({ async: false })
export class CustomResearchObjectiveValidation implements ValidatorConstraintInterface {
    public validate(researchObjectives: { researchObjective: string }[]) {
        if (!researchObjectives) return false;
        if (researchObjectives.map(a => a.researchObjective).indexOf('') !== -1) return false;
        if (researchObjectives.length < 1) return false;
        return true;
    }
}
export class CreateStrategyAndTreatmentDto {
    @ApiProperty({
        description: 'Icon URL or path',
        example: 'https://example.com/icon.png'
    })
    @IsNotEmpty()
    @IsString()
    icon: string;

    @ApiProperty({
        description: 'Title of the strategy and treatment',
        example: 'Clinical Trial Phase 1'
    })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Description of the  strategy and treatment',
        example: 'Initial trials for testing efficacy.'
    })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiPropertyOptional({
        description: 'Published status',
        example: true
    })
    @IsOptional()
    @IsBoolean()
    published?: boolean;

    @ApiProperty({
        description: 'Medicine ID related to the  strategy and treatment',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsNotEmpty()
    @IsUUID()
    medId: string;

    @ApiProperty({
        description: 'List of research objectives',
        type: [ResearchObjectiveDto]
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ResearchObjectiveDto)
    @Validate(CustomResearchObjectiveValidation, { message: "Research objectives should not be empty and should not be less than one." })
    researchObjectives: ResearchObjectiveDto[];
}
