import { Module } from '@nestjs/common';
import { LinkedinReferenceService } from './linkedin-reference.service';
import { LinkedinReferenceController } from './linkedin-reference.controller';
import { ContactService } from '../contacts/contacts.service';
import { DealLogsService } from '../deal-logs/deal-logs.service';

@Module({
  providers: [LinkedinReferenceService, ContactService, DealLogsService],
  controllers: [LinkedinReferenceController],
  exports: [LinkedinReferenceService]
})
export class LinkedinReferenceModule {}
