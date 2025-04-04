import { Module } from '@nestjs/common';
import { ContactExperienceService } from './contact-experience.service';
import { ContactExperienceController } from './contact-experience.controller';

@Module({
  providers: [ContactExperienceService],
  controllers: [ContactExperienceController]
})
export class ContactExperienceModule {}
