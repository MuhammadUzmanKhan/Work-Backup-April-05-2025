import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
dotenv.config();

@Module({
  imports: [],
  controllers: [SchedulingController],
  providers: [SchedulingService],
})
export class SchedulingModule {}
