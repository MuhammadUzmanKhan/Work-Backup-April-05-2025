import { Module } from "@nestjs/common";
import { MongoExportController } from "./mongo-export.controller";
import { MongoExportBiddersService } from "./mongo-export-bidders.service";
import { MongoExportCompaniesService } from "./mongo-export-companies.service";
import { MongoExportIndustriesService } from "./mongo-export-industries.service";
import { MongoExportProfilesService } from "./mongo-export-profiles.service";
import { MongoExportTagsService } from "./mongo-export-tags.service";
import { TagService } from "../tags/tags.service";
import { MongoExportLinkedinAccountsDataService } from "./mongo-export-linkedin-accounts-service";
import { ConfigService } from "@nestjs/config";
import { LinkedinAccountInstitutionDegreeService } from "../linkedin-accounts/linkedin-contact.service";
import { InstitutionService } from "../institutions/institution.service";
import { EducationService } from "../education/education.service";
import { ExperienceService } from "../experience/experience.service";
import { SkillService } from "../skills/skill.service";
import { LinkedinAccountCompanyService } from "../linkedin-account-companies/linkedin-account-company.service";
// import { MongoExportCodeSnippetsService } from "./mongo-export-code-snippets.service";
// import { MongoExportProjectsService } from "./mongo-export-projects.service";
// import { MongoExportGithubLinksService } from "./mongo-export-github-links.service";
// import { MongoExportClickupTemplatesService } from "./mongo-export-clickup-templates.service";
import { MongoExportBidsService } from "./mongo-export-bids.service";
import { AccountJobBidService } from "../accounts/account-bid-job.service";
import { JobService } from "../jobs/jobs.service";
import { BidService } from "../bids/bids.service";
import { JobAccountService } from "../jobs/job-account-service";
import { AccountService } from "../accounts/accounts.service";
import { IntegrationsServiceClickup } from "../integrations/clickup/clickup.service";
import { JobBidService } from "../jobs/job-bid-service";
import { UserService } from "../user/user.service";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { DealLogsService } from "../deal-logs/deal-logs.service";
import { DynamicModelsModule } from "src/common/mongo-collections/dynamic-models.module";
import { ContactService } from "../contacts/contacts.service";
import { CompaniesService } from "../companies/companies.service";
import { ContactExperienceService } from "../contact-experience/contact-experience.service";
import { LinkedinReferenceService } from "../linkedin-reference/linkedin-reference.service";
@Module({
    imports: [DynamicModelsModule],
    controllers: [MongoExportController],
    providers: [
        MongoExportBiddersService,
        MongoExportCompaniesService,
        MongoExportIndustriesService,
        MongoExportProfilesService,
        MongoExportTagsService,
        TagService,
        // MongoExportCodeSnippetsService,
        // MongoExportProjectsService,
        // MongoExportGithubLinksService,
        // MongoExportClickupTemplatesService,
        MongoExportLinkedinAccountsDataService,
        ConfigService,
        LinkedinAccountInstitutionDegreeService,
        InstitutionService,
        EducationService,
        ExperienceService,
        LinkedinAccountCompanyService,
        SkillService,
        MongoExportBidsService,
        AccountJobBidService,
        JobService,
        BidService,
        JobAccountService,
        JobBidService,
        AccountService,
        IntegrationsServiceClickup,
        IntegrationsServiceHubspot,
        UserService,
        DealLogsService,
        ContactService,
        CompaniesService,
        ContactExperienceService,
        LinkedinReferenceService,
    ],
})
export class MongoExportModule { }
