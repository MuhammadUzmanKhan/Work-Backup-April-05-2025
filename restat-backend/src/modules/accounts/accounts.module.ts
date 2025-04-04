import { Module } from '@nestjs/common';
import { AccountController } from './accounts.controller';
import { AccountService } from './accounts.service';
import { AccountJobBidService } from './account-bid-job.service';
import { JobService } from '../jobs/jobs.service';
import { BidService } from '../bids/bids.service';
import { TagService } from '../tags/tags.service';
import { JobAccountService } from '../jobs/job-account-service';
import { IntegrationsServiceClickup } from '../integrations/clickup/clickup.service';
import { ConfigService } from '@nestjs/config';
import { JobBidService } from '../jobs/job-bid-service';
import { UserService } from '../user/user.service';
import { IntegrationsServiceHubspot } from '../integrations/hubspot/hubspot.service';
import { DealLogsService } from '../deal-logs/deal-logs.service';
import { DynamicModelsModule } from 'src/common/mongo-collections/dynamic-models.module';
import { ContactService } from '../contacts/contacts.service';
import { CompaniesService } from '../companies/companies.service';
import { ContactExperienceService } from '../contact-experience/contact-experience.service';
import { LinkedinReferenceService } from '../linkedin-reference/linkedin-reference.service';
@Module({
    imports: [DynamicModelsModule],
    controllers: [AccountController],
    providers: [AccountService, AccountJobBidService, JobService, BidService, TagService, JobAccountService, IntegrationsServiceClickup, ConfigService, JobBidService, UserService, IntegrationsServiceHubspot, DealLogsService, ContactService, CompaniesService, ContactExperienceService, LinkedinReferenceService],
    exports: [AccountJobBidService],
})

export class AccountModule { }
