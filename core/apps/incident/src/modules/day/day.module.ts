import { Module } from '@nestjs/common';
import { DayService } from './day.service';
import { DayController } from './day.controller';

@Module({
  controllers: [DayController],
  providers: [DayService],
})
export class DayModule {}
