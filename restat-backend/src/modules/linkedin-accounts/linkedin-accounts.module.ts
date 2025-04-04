import { Module } from '@nestjs/common';
import { LinkedinAccountController } from './linkedin-accounts.controller';
import { LinkedinAccountInstitutionDegreeService } from './linkedin-contact.service';
import { InstitutionService } from '../institutions/institution.service';
import { EducationService } from '../education/education.service';
import { SkillService } from '../skills/skill.service';
import { LinkedinAccountCompanyService } from '../linkedin-account-companies/linkedin-account-company.service';
import { ExperienceService } from '../experience/experience.service';
import { ConfigService } from '@nestjs/config';
import { IntegrationsServiceHubspot } from '../integrations/hubspot/hubspot.service';
import { DynamicModelsModule } from 'src/common/mongo-collections/dynamic-models.module';
import { ContactService } from '../contacts/contacts.service';
import { LinkedinReferenceService } from '../linkedin-reference/linkedin-reference.service';
import { CompaniesService } from '../companies/companies.service';
import { ContactExperienceService } from '../contact-experience/contact-experience.service';
import { DealLogsService } from '../deal-logs/deal-logs.service';

@Module({
    imports: [DynamicModelsModule],
    controllers: [LinkedinAccountController],
    providers: [
        LinkedinAccountInstitutionDegreeService,
        InstitutionService,
        EducationService,
        SkillService,
        LinkedinAccountCompanyService,
        ExperienceService,
        ConfigService,
        IntegrationsServiceHubspot,
        ContactService,
        LinkedinReferenceService,
        CompaniesService,
        ContactExperienceService,
        DealLogsService,
    ]
})
export class LinkedinAccountModule { }
