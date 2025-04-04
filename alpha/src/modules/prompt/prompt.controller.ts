import { Body, Controller, Post } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { Public } from 'src/common/decorators/public.meta';

@Controller('prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Public()
  @Post('generate')
  async generateCompletion(
    @Body('prompt') prompt: string,
    @Body('isFirst') isFirst: boolean,
  ) {
    return this.promptService.generateCompletion(prompt, isFirst);
  }
}
