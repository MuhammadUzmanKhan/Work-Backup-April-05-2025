import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { ContactExperienceService } from '../contact-experience/contact-experience.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, ContactExperienceService],
  exports: [CompaniesService]
})
export class CompaniesModule {}
