import { Module } from '@nestjs/common';
import { TicketClearController } from './ticket-clear.controller';
import { TicketClearService } from './ticket-clear.service';

@Module({
  controllers: [TicketClearController],
  providers: [TicketClearService],
})
export class TicketClearModule {}
