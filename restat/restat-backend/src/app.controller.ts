import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { Public } from "./common/decorators/public.meta";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get("/health-check")
  public getHealthCheck() {
    return this.appService.getHealthCheck()
  }
}
