import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { ConfigService } from "@nestjs/config";
import { ContactService } from "../contacts/contacts.service";
import { DealLogsService } from "../deal-logs/deal-logs.service";
import { LinkedinReferenceService } from "../linkedin-reference/linkedin-reference.service";
import { BidService } from "../bids/bids.service";
import { JobAccountService } from "../jobs/job-account-service";
import { IntegrationsServiceClickup } from "../integrations/clickup/clickup.service";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { AccountService } from "../accounts/accounts.service";
import { JobService } from "../jobs/jobs.service";
import { TagService } from "../tags/tags.service";

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, ConfigService, ContactService, DealLogsService, LinkedinReferenceService, BidService, JobAccountService, IntegrationsServiceClickup, IntegrationsServiceHubspot, AccountService, JobService, TagService],
})
export class UsersModule { }
