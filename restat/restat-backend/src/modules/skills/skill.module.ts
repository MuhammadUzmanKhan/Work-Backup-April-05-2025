import { Module } from '@nestjs/common';
import { skillController } from './skill.controller';
import { SkillService } from './skill.service';

@Module({
    controllers: [skillController],
    providers: [SkillService]
})
export class SkillModule { }
