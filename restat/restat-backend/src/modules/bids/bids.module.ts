import { Module } from '@nestjs/common';
import { BidsController } from './bids.controller';
import { BidService } from './bids.service';
import { JobAccountService } from '../jobs/job-account-service';
import { AccountService } from '../accounts/accounts.service';
import { JobService } from '../jobs/jobs.service';
import { TagService } from '../tags/tags.service';
import { BidJobAccountService } from './bids-jobs-accounts.service';
import { UserService } from '../user/user.service';
import { ProfileService } from '../profiles/profile.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { ConfigService } from '@nestjs/config';
import { IntegrationsServiceClickup } from '../integrations/clickup/clickup.service';
import { IntegrationsServiceHubspot } from '../integrations/hubspot/hubspot.service';
import { DealLogsService } from '../deal-logs/deal-logs.service';
import { JobBidService } from '../jobs/job-bid-service';
import { DynamicModelsProvider } from 'src/common/mongo-collections/dynamic-models.provider';
import { DynamicModelsModule } from 'src/common/mongo-collections/dynamic-models.module';
import { ContactService } from '../contacts/contacts.service';
import { LinkedinReferenceService } from '../linkedin-reference/linkedin-reference.service';
import { StripeModule } from '../payments/stripe/stripe.module';

@Module({
    imports: [DynamicModelsModule, StripeModule],
    controllers: [BidsController],
    providers: [AccountService, JobService, BidService, JobAccountService, TagService, BidJobAccountService, UserService, ProfileService, WorkspaceService, ConfigService, IntegrationsServiceClickup, IntegrationsServiceHubspot, JobBidService, DealLogsService, DynamicModelsProvider, ContactService, LinkedinReferenceService],
    exports: [BidService]
})
export class BidsModule { }
