import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Jobs } from "src/common/models/jobs.model";
import { BidService } from "../bids/bids.service";
import { jobsMessages } from "src/common/constants/messages";

@Injectable()
export class JobBidService {
  constructor(private readonly bidService: BidService) { }
  public async getBiddersAccountIds(userId: string, profile?: string) {
    try {
      const { jobsIds } = await this.bidService.getAllBiddersJobsIds(userId, profile);
      const jobs = await Jobs.findAll({
        where: { id: jobsIds },
      });
      const accountsIds = jobs.map((job: any) => job.accountId);
      return accountsIds
    } catch (err) {
      throw new InternalServerErrorException(jobsMessages.bidderAccountIdsError);
    }
  }

  public async getCompanyAccountIds(userIds: any, profile?: any) {
    try {
      const { jobsIds } = await this.bidService.getAllCompanyJobsIds(userIds, profile);
      const jobs = await Jobs.findAll({
        where: { id: jobsIds },
        attributes: ['accountId'],
      });
      const accountsIds = jobs.map((job: any) => job.accountId);
      return accountsIds
    } catch (err) {
      throw new InternalServerErrorException(jobsMessages.companyAccountIdsError);
    }
  }
}
