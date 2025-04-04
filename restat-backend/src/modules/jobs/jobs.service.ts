import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Jobs } from "src/common/models/jobs.model";
import { TagService } from "../tags/tags.service";
import { JobDto } from "./dto/jobs.dto";
import { JobsTags } from "src/common/models/jobs-tags.model";
import { Source } from "src/types/enum";
import { Sequelize } from "sequelize";
import { ConfigService } from "@nestjs/config";
import pg from "pg";
import { Op } from "sequelize";
import { CreateManualBidDto } from "../bids/dto/manual-bids.dto";
import { jobsMessages } from "src/common/constants/messages";

@Injectable()
export class JobService {
  constructor(
    private readonly tagService: TagService,
    private readonly configService: ConfigService,
  ) { }

  public async createManualJob({ jobTitle, jobUrl, jobPosted, jobDescription }: CreateManualBidDto): Promise<{ message: string, isAlreadyExist: boolean, job: Jobs }> {
    if (!jobUrl) {
      throw new BadRequestException(jobsMessages.jobUrlRequired);
    }

    let job = await Jobs.findOne({
      where: { url: jobUrl },
    });

    if (job) {
      return {
        message: jobsMessages.jobFound,
        isAlreadyExist: true,
        job,
      };
    }

    try {
      let job = await Jobs.create({
        title: jobTitle,
        url: jobUrl,
        postedDate: jobPosted === "" ? null : jobPosted,
        description: jobDescription,
      });

      return {
        message: jobsMessages.jobCreated,
        isAlreadyExist: false,
        job,
      };
    } catch (error) {
      console.error(jobsMessages.jobCreatedError(''), error);
      throw new InternalServerErrorException(error);
    }
  }

  public async createOrFindJob(workspaceId: string, jobDetails: JobDto): Promise<{ message: string, isAlreadyExist: boolean, job: Jobs }> {
    const {
      jobTitle,
      jobCategories,
      jobDescription,
      jobSkills,
      jobAttributes,
      jobPosted,
      jobURL,
      inviteOnly,
      jobConnects,
    } = jobDetails;

    const {
      experienceLevel,
      hourlyRange,
      hourly,
      projectLengthDuration,
      featuredJob,
      proposeYourTerms,
    } = jobAttributes;

    if (!jobURL) {
      throw new BadRequestException(jobsMessages.jobUrlRequired);
    }

    let job = await Jobs.findOne({ where: { url: jobURL } });

    if (job) {
      return {
        message: jobsMessages.jobFoundAndSynced,
        isAlreadyExist: true,
        job,
      };
    }

    try {
      let job = await Jobs.create({
        title: jobTitle,
        description: jobDescription,
        category: jobCategories,
        postedDate: jobPosted,
        experienceLevel,
        hourlyRange,
        hourly,
        connects: jobConnects,
        projectLength: projectLengthDuration,
        url: jobURL,
        featured: featuredJob,
        proposeYourTerms,
        inviteOnly,
      });

      if (jobSkills.length > 0) {
        const { tags } = await this.tagService.createTags(
          jobSkills,
          Source.UPWORK,
          workspaceId,
        );
        await job.assignJobTags(workspaceId, tags);
      }

      return {
        message: jobsMessages.jobCreated,
        isAlreadyExist: false,
        job,
      };
    } catch (error) {
      console.error(jobsMessages.jobCreatedError(''), error);
      throw new InternalServerErrorException(error);
    }
  }

  public async updateJob(workspaceId: string, jobDetails: JobDto) {
    const {
      jobTitle,
      jobCategories,
      jobDescription,
      jobSkills,
      jobAttributes,
      inviteOnly,
      jobURL,
      jobPosted,
      jobConnects,
    } = jobDetails;

    const {
      experienceLevel,
      hourlyRange,
      hourly,
      projectLengthDuration,
      proposeYourTerms,
      featuredJob,
    } = jobAttributes;

    let job = await Jobs.findOne({ where: { url: jobURL } });

    try {
      if (!job) {
        // throw new NotFoundException(jobsMessages.jobMustSync);
       job = await Jobs.create({
          title: jobTitle,
          description: jobDescription,
          category: jobCategories,
          postedDate: jobPosted,
          experienceLevel,
          hourlyRange,
          hourly,
          connects: jobConnects,
          projectLength: projectLengthDuration,
          url: jobURL,
          featured: featuredJob,
          proposeYourTerms,
          inviteOnly,
        });
      } else {
        await Jobs.update(
          {
            title: jobTitle,
            description: jobDescription,
            category: jobCategories,
            experienceLevel,
            hourlyRange,
            hourly,
            projectLength: projectLengthDuration,
            featured: featuredJob,
            inviteOnly,
            proposeYourTerms,
          },
          {
            where: {
              url: jobURL
            },
          }
        );
      }

      if (jobSkills.length > 0) {
        const { tags } = await this.tagService.createTags(
          jobSkills,
          Source.UPWORK,
          workspaceId,
        );
        const jobsTags = await job.getJobTags(workspaceId, job.id);
        // // make the array of just ids
        const portfolioTagsIds = jobsTags.map((tag) => tag.tagId);
        const tagsIds = tags.map((tag) => tag.id);
        // Use filter to find tags that are in tags but not in jobTags
        const tagsToDelete = jobsTags.filter(
          (tag) => !tagsIds.includes(tag.tagId)
        );
        const { deletionError } = await job.deleteJobTags(tagsToDelete);
        // Use filter to find tags that are in jobTags but not in tags
        const tagsToAdd = tags.filter(
          (tag) => !portfolioTagsIds.includes(tag.id)
        );
        await job.assignJobTags(workspaceId, tagsToAdd);
        if (deletionError) {
          throw new InternalServerErrorException(deletionError);
        }
      }

      return {
        message: jobsMessages.jobUpdated,
        job,
      };

    } catch (error) {
      console.error(jobsMessages.jobUpadteError, error)
      throw new InternalServerErrorException(error);
    }
  }

  public async getJobById(workspaceId: string, jobId: string) {
    const job = await Jobs.findOne({
      where: { id: jobId },
      include: [
        {
          model: JobsTags,
          where: { workspaceId },
          attributes: ["tagId"],
        },
      ],
    });
    if (!job) {
      throw new NotFoundException(jobsMessages.jobNotFound);
    }
    return {
      message: jobsMessages.jobFound,
      job,
    };
  }

  public async getJobIds(search: string) {
    let jobIds: string[] = [];
    const jobs = await Jobs.findAll({
      where: {
        [Op.or]: [
          {
            category: {
              [Op.iLike]: `%${search}%`,
            }
          },
          {
            title: {
              [Op.iLike]: `%${search}%`,
            }
          },
          {
            experienceLevel: {
              [Op.iLike]: `%${search}%`,
            }
          },
          {
            hourlyRange: {
              [Op.iLike]: `%${search}%`,
            }
          },
          {
            projectLength: {
              [Op.iLike]: `%${search}%`,
            }
          }

        ]
      },
      attributes: ["id"],
    });
    jobIds = jobs.map((job) => job.id);
    return {
      jobIds,
    };
  }

  public async deleteJobById(jobId: string) {
    const job = await Jobs.findOne({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException(jobsMessages.jobNotFound);
    }
    await Jobs.destroy({ where: { id: jobId } });
    return {
      message: jobsMessages.jobDeleted,
    };
  }

  public async getJobCategories(): Promise<any[]> {
    try {
      const sequelize = new Sequelize({
        dialect: "postgres",
        host: this.configService.get("DB_HOST"),
        port: this.configService.get("DB_PORT"),
        username: this.configService.get("DB_USERNAME"),
        password: this.configService.get("DB_PASSWORD"),
        database: this.configService.get("DB_DATABASE"),
        dialectModule: pg,
        dialectOptions: +this.configService.get("SSL") ? {
          ssl: {
            require: true, // This will help you. But you will see nwe error
            rejectUnauthorized: false // This line will fix new error
          }
        } : {},
      });
      // Use type assertion to explicitly specify the result type as JobCategory[]
      const results: any[] = await sequelize.query(`
        SELECT category, COUNT(*) AS count, ARRAY_AGG(id) AS jobIds
        FROM jobs
        GROUP BY category
        ORDER BY count DESC
        LIMIT 15;  -- Limit to only 15 rows
      `);
      return results[0];
    } catch (error) {
      throw new InternalServerErrorException(jobsMessages.jobCategoriesFetchedError);
    }
  }

}
