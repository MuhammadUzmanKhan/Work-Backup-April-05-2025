import { Injectable } from '@nestjs/common';
import { ContactExperience } from 'src/common/models/contact-experience.model';

@Injectable()
export class ContactExperienceService {

    public async getExperienceByContactIdCompanyId(contactId: string, companyId: string, title?: string) {
        return await ContactExperience.findOne({
            where: {
                contactId,
                companyId,
                ...(title && { title }),
            },
        });
    }


    public async createExperienceByContactIdCompanyId(contactId: string, companyId: string, duration?: string, totalDuration?: string, title?: string) {
        return await ContactExperience.create({
            contactId,
            companyId,
            ...(duration && { duration }),
            ...(totalDuration && { totalDuration }),
            ...(title && { title }),
        });
    }

    public async updateExperienceByContactIdCompanyId(contactId: string, companyId: string, duration?: string, totalDuration?: string, title?: string) {
        return await ContactExperience.update({
            ...(duration && { duration }),
            ...(totalDuration && { totalDuration }),
        }, {
            where: {
                contactId,
                companyId,
                ...(title && { title }),
            }
        });
    }







}
