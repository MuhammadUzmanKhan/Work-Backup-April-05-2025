import { Module } from '@nestjs/common';
import { UpworkApisService } from './upwork-apis.service';
import { UpworkApisController } from './upwork-apis.controller';
import { JobService } from '../jobs/jobs.service';
import { ContactService } from '../contacts/contacts.service';
import { BidService } from '../bids/bids.service';
import { TagService } from '../tags/tags.service';
import { LinkedinReferenceService } from '../linkedin-reference/linkedin-reference.service';
import { DealLogsService } from '../deal-logs/deal-logs.service';
import { JobAccountService } from '../jobs/job-account-service';
import { IntegrationsServiceClickup } from '../integrations/clickup/clickup.service';
import { IntegrationsServiceHubspot } from '../integrations/hubspot/hubspot.service';
import { AccountService } from '../accounts/accounts.service';

@Module({
  providers: [
    UpworkApisService,
    JobService,
    ContactService,
    BidService,
    TagService,
    LinkedinReferenceService,
    DealLogsService,
    JobAccountService,
    IntegrationsServiceClickup,
    IntegrationsServiceHubspot,
    AccountService
    
  ],
  controllers: [UpworkApisController],
})
export class UpworkApisModule { }
