import { Module } from '@nestjs/common';
import { DealLogsController } from './deal-logs.controller';
import { DealLogsService } from './deal-logs.service';

@Module({
  controllers: [DealLogsController],
  providers: [DealLogsService],
  exports: [DealLogsService],
})
export class DealLogsModule { }
