import { Controller, Get } from '@nestjs/common';
import { Public } from '@ontrack-tech-group/common/decorators';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  healthCheck(): { success: boolean } {
    return this.appService.healthCheck();
  }
}
