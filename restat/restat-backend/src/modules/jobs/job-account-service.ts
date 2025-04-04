import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { AccountService } from "../accounts/accounts.service";
import { TagService } from "../tags/tags.service";
import { JobService } from "./jobs.service";
import { Jobs } from "src/common/models/jobs.model";
import { jobsMessages } from "src/common/constants/messages";

@Injectable()
export class JobAccountService {
  constructor(
    private readonly accountService: AccountService,
    private readonly jobService: JobService,
    private readonly tagService: TagService,
  ) { }

  public async getJobById(workspaceId: string, jobId: string) {
    const { job } = await this.jobService.getJobById(workspaceId, jobId);
    const { tags } = await this.tagService.getAllJobTags(job.jobsTags);
    const { account } = await this.accountService.getAccountById(job.accountId);
    // Convert the Sequelize instance to a plain JavaScript object
    const jobData = job.toJSON();

    // Delete the 'jobsTags' property from the plain object
    delete jobData.jobsTags;

    return {
      message: jobsMessages.jobFound,
      job: jobData,
      tags,
      account,
    };
  }

  public async getJobsByState() {
    try {
      const jobIdsByState = [];
      const data = await this.accountService.getAccountState();

      // return { jobIdsByState: data }
      let accountIds = data.map(
        (account: {
          count: number;
          locationCountry: string;
          accountids: string[];
        }) => account.accountids
      );
      for (let i = 0; i < accountIds.length; i++) {
        const jobs = await Jobs.findAll({
          where: {
            accountId: accountIds[i],
          },
        });
        const jobIds = jobs.map((job: any) => job.id);
        jobIdsByState.push({ state: data[i].locationCountry, jobIds });
      }
      return {
        message: jobsMessages.jobsFound,
        jobIdsByState,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(jobsMessages.jobsFoundError);
    }
  }


}
