import { PartialType } from "@nestjs/swagger";
import { CreateStrategyAndTreatmentDto } from "./create.dto";
import {
    IsArray,
    ValidateNested,
    IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResearchObjectiveDto } from './research-objective.dto';

export class UpdateStrategyAndTreatmentDto extends PartialType(CreateStrategyAndTreatmentDto) {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PartialType(ResearchObjectiveDto))
    researchObjectives?: ResearchObjectiveDto[];
}
