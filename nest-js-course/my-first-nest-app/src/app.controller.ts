import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DateRange } from './date-range.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Get()
  // @Render('index')
  // index() {
  //   return {}
  // }
  @Get('/login')
  login() {
    return { name: '<h1>Hello world</h1>' };
  }
  @Get('/events')
  getEvents(@DateRange() dates: { startDate: Date; endDate: Date }) {
    // This logic will only execute if dates are valid
    return {
      message: `Fetching events from ${dates.startDate.toISOString()} to ${dates.endDate.toISOString()}`,
    };
  }
}
