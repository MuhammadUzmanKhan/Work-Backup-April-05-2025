import { Module } from '@nestjs/common';
import { StrategyAndTreatmentService } from './strategy-and-treatment.service';
import { StrategyAndTreatmentController } from './strategy-and-treatment.controller';

@Module({
    imports: [],
    controllers: [StrategyAndTreatmentController],
    providers: [StrategyAndTreatmentService]
})
export class StrategyAndTreatmentModule {}