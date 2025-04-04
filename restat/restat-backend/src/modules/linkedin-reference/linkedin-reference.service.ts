import { Injectable } from '@nestjs/common';
import { LinkedinReferences } from 'src/common/models/linkedin-reference';

@Injectable()
export class LinkedinReferenceService {


    public async getReferenceByContactIdProfileId(contactId: string, linkedinProfileId: string) {
        return await LinkedinReferences.findOne({
            where: {
                contactId, linkedinProfileId
            }
        })
    }

    public async createReference(contactId: string, linkedinProfileId: string, userId: string, industryId: string, linkedinConnectedDate?: string, linkedinConnected: boolean = false,) {
        return await LinkedinReferences.create({
            contactId, linkedinProfileId, userId, industryId, linkedinConnectedDate, linkedinConnected
        })
    }

    public async updateReference(contactId: string, linkedinProfileId: string, linkedinConnectedDate?: string, linkedinConnected: boolean = false,) {
        return await LinkedinReferences.update({
              linkedinConnectedDate, linkedinConnected
        }, {where: {
            contactId, linkedinProfileId
        }})
    }

}
