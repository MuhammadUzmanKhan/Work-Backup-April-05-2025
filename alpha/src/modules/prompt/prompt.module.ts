import { Module } from '@nestjs/common';
import { PromptController } from './prompt.controller';
import { PromptService } from './prompt.service';
import { ProjectService } from '../project/project.service';

@Module({
  controllers: [PromptController],
  providers: [PromptService, ProjectService],
})
export class PromptModule {}
