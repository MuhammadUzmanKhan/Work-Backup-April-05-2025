import { Module } from '@nestjs/common';
import { experienceController } from './experience.controller';
import { ExperienceService } from './experience.service';

@Module({
    controllers: [experienceController],
    providers: [ExperienceService]
})
export class ExperienceModule { }
