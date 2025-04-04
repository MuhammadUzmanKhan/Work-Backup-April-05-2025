import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '@ontrack-tech-group/common/decorators';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  healthCheck() {
    return this.appService.healthCheck();
  }
}
