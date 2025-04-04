import { Module } from '@nestjs/common';
import { JobController } from './jobs.controller';
import { JobService } from './jobs.service';
import { TagService } from '../tags/tags.service';
import { ConfigService } from '@nestjs/config';
import { JobAccountService } from './job-account-service';
import { AccountService } from '../accounts/accounts.service';
import { JobBidService } from './job-bid-service';
import { BidService } from '../bids/bids.service';
import { IntegrationsServiceClickup } from '../integrations/clickup/clickup.service';
import { IntegrationsServiceHubspot } from '../integrations/hubspot/hubspot.service';
import { DealLogsService } from '../deal-logs/deal-logs.service';
import { DynamicModelsModule } from 'src/common/mongo-collections/dynamic-models.module';
import { ContactService } from '../contacts/contacts.service';
import { LinkedinReferenceService } from '../linkedin-reference/linkedin-reference.service';
@Module({
    imports: [DynamicModelsModule],
    controllers: [JobController],
    providers: [TagService, JobService, ConfigService, JobAccountService, AccountService, JobBidService, BidService, IntegrationsServiceClickup, IntegrationsServiceHubspot, DealLogsService, ContactService, LinkedinReferenceService]
})
export class JobModule { }
