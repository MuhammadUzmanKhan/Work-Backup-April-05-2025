import { Module } from '@nestjs/common';
import { ContactService } from './contacts.service';
import { ContactController } from './contacts.controller';
import { LinkedinReferenceService } from '../linkedin-reference/linkedin-reference.service';
import { DealLogsService } from '../deal-logs/deal-logs.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, LinkedinReferenceService, DealLogsService],
  exports: [ContactService]
})
export class ContactModule {}
