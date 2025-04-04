import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { BidDto } from "./dto/bid.dto";
import { Bids } from "src/common/models/bids.model";
import { EXCEPTIONS } from "src/common/constants/exceptions";
import { JobAccountService } from "../jobs/job-account-service";
import * as moment from "moment";
import { Op } from "sequelize";
import { BidStatus } from "src/types/enum";
import { IntegrationsServiceClickup } from "../integrations/clickup/clickup.service";
import { Jobs } from "src/common/models/jobs.model";
import { Users } from "src/common/models/users.model";
import { Profiles } from "src/common/models/profiles.model";
import { formatMessages, getUpworkRestatFields, getUpworkRestatFieldsForManualBid } from "src/common/helpers";
import { IClient } from "src/common/constants/client";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { INTEGRATION_OPTION } from "src/types/integrations";
import { Accounts } from "src/common/models/accounts.model";
import { UpdateBidDto, UpdateJobDto } from "./dto/bid-details.dto";
import { DealLogsService } from "../deal-logs/deal-logs.service";
import { DEAL_LOG_TYPE } from "src/common/constants/bids";
import { CreateDealLogDto } from "../deal-logs/dto/create-deal-log.dto";
import { IMessage } from "src/types/bids";
import { INTEGRATION_TYPES } from "src/common/constants/integrations";
import { Contacts } from "src/common/models/contacts.model";
import { ContactService } from "../contacts/contacts.service";
import { CreateManualBidDto } from "./dto/manual-bids.dto";
import { bidsMessages, clickUpMessages, contactsMessages, hubspotMessages, logsMessages } from "src/common/constants/messages";

@Injectable()
export class BidService {
  constructor(
    private readonly jobAccountService: JobAccountService,
    private readonly integrationService: IntegrationsServiceClickup,
    private readonly integrationServiceHubspot: IntegrationsServiceHubspot,
    private readonly dealLogsService: DealLogsService,
    private readonly contactService: ContactService,
  ) {
  }
  private dealLogMessage: string[] = [];

  public async createManualBid(user: Users, contactId: string, job: Jobs, contact: Contacts, bidDto: CreateManualBidDto): Promise<{ message: string, isAlreadyExist: boolean, bid: Bids }> {
    const {
      bidCoverLetter,
      bidProfileId,
      bidResponse,
      responseDate,
      contractDate,
      boosted,
      invite,
      isManual,
      proposedRate,
      receivedAmount,
      upworkProposalUrl,
      userId,
      bidProfileAgency,
      bidProfileBusinessManager,
      bidProfileFreelancer,
      connects,
      proposedProfile
    } = bidDto


    const bidAlreadyExists = await Bids.findOne({
      where: {
        upworkProposalURL: upworkProposalUrl
      },
    });

    if (bidAlreadyExists) {
      throw new ConflictException(EXCEPTIONS.BID_ALREADY_EXISTS);
    }

    try {
      const bid = await Bids.create({
        jobId: job.id,
        userId,
        contactId,
        bidProfileId,
        upworkProposalURL: upworkProposalUrl,
        coverLetter: bidCoverLetter,
        bidProfileFreelancer,
        bidProfileAgency,
        bidProfileBusinessManager,
        connects,
        boosted,
        bidResponse,
        status: contractDate ? BidStatus.COMPLETED : BidStatus.ACTIVE,
        contractDate: contractDate === '' ? null : contractDate,
        proposedProfile,
        proposedRate,
        receivedAmount,
        responseDate: responseDate === '' ? null : responseDate,
        dateTime: moment().format(),
        invite,
        isManual,
        createdAt: responseDate ?? contractDate
      });

      await this.dealLogsService.createDealLog(user.id, {
        bidId: bid.id,
        dealLogType: contractDate ? DEAL_LOG_TYPE.JOB_CREATED : DEAL_LOG_TYPE.LEAD_SYNCED,
        message: `${contractDate ? 'Contract Created' : 'Lead Synced'} Manually.`,
        userId: user.id,
      } as CreateDealLogDto);

      const { message } = await this.createIntegratedEnteriesForDirectLeads({ user, bid, contact, job });

      return {
        message: formatMessages(message),
        isAlreadyExist: false,
        bid,
      };
    } catch (err: any) {
      console.error('Error Occurred in createManualBid', err)
      if (err instanceof HttpException) throw err;
      else throw new InternalServerErrorException(err);
    }
  }

  public async createBid(userId: string, contactId: string, bidDto: BidDto): Promise<{ message: string, isAlreadyExist: boolean, bid: Bids }> {
    const {
      bidProfile,
      bidCoverLetter,
      bidProfileFreelancer,
      bidProfileAgency,
      bidProfileBusinessManager,
      bidURL,
      connects,
      boosted,
      bidResponse,
      profile,
      rate,
      receivedAmount,
      response,
      bidTime,
      bidQuestions,
      invite,
      jobObjId,
      migratedData,
      isManual,
      contractDate,
      jobId
    } = bidDto;

    const cleanBidURL = bidURL.includes("?") ? bidURL.split("?")[0] : bidURL;
    const bidURLNumber = cleanBidURL.replace(/^.*\//, '');
    const bidAlreadyExists = await Bids.findOne({
      where: {
        upworkProposalURL: {
          [Op.like]: `%${bidURLNumber}`,
        },
      },
    });

    if (bidAlreadyExists) {
      if (migratedData) {
        return {
          message: bidsMessages.bidExists,
          isAlreadyExist: true,
          bid: bidAlreadyExists,
        };
      }
      throw new ConflictException(EXCEPTIONS.BID_ALREADY_EXISTS);
    }

    try {
      const bid = await Bids.create({
        jobId,
        userId,
        bidProfileId: bidProfile,
        contactId,
        upworkProposalURL: cleanBidURL,
        coverLetter: bidCoverLetter,
        bidProfileFreelancer,
        bidProfileAgency,
        bidProfileBusinessManager,
        connects,
        boosted,
        bidResponse,
        status: bidResponse ? BidStatus.ACTIVE : BidStatus.PENDING,
        proposedProfile: profile,
        proposedRate: rate,
        receivedAmount,
        responseDate: response && response.date ? new Date(response.date) : null,
        bidQuestionAnswers: bidQuestions,
        dateTime: bidTime,
        invite,
        jobObjId,
        isManual,
        contractDate,
      });

      await this.dealLogsService.createDealLog(userId, {
        bidId: bid.id,
        dealLogType: DEAL_LOG_TYPE.BID_CREATED,
        message: logsMessages.proposalLogCreated,
        userId,
      } as CreateDealLogDto);

      return {
        message: bidsMessages.proposalSynced,
        isAlreadyExist: false,
        bid,
      };
    } catch (err: any) {
      console.error(bidsMessages.proposalSyncError, err)
      if (err instanceof HttpException) throw err;
      else throw new InternalServerErrorException(err);
    }
  }

  public async updateBid(bidDto: BidDto, job: Jobs, user: Users, client?: IClient, jobSkills?: string[]): Promise<{ message: IMessage[], bid: Bids }> {
    const {
      bidProfile,
      bidCoverLetter,
      bidProfileFreelancer,
      bidProfileAgency,
      bidProfileBusinessManager,
      bidURL,
      boosted,
      bidResponse,
      profile,
      rate,
      receivedAmount,
      response,
      bidQuestions,
      invite,
      isManual,
      contractDate,
      connects,
      bidTime,
      contactId,
    } = bidDto;

    const cleanBidURL = bidURL.includes("?") ? bidURL.split("?")[0] : bidURL;
    const bidURLNumber = cleanBidURL.replace(/^.*\//, '');
    let bid = await Bids.findOne({
      where: {
        upworkProposalURL: {
          [Op.like]: `%${bidURLNumber}`,
        },
      },
    });

    try {
      if (!bid) {
        bid = await Bids.create({
          jobId: job.id,
          userId: user.id,
          bidProfileId: bidProfile,
          contactId,
          upworkProposalURL: cleanBidURL,
          coverLetter: bidCoverLetter,
          bidProfileFreelancer,
          bidProfileAgency,
          bidProfileBusinessManager,
          connects,
          boosted,
          bidResponse,
          status: bidResponse ? BidStatus.ACTIVE : BidStatus.PENDING,
          proposedProfile: profile,
          proposedRate: rate,
          receivedAmount,
          responseDate: response && response.date ? new Date(response.date) : null,
          bidQuestionAnswers: bidQuestions,
          dateTime: bidTime,
          invite,
          isManual,
          contractDate,
        });
        // throw new NotFoundException(EXCEPTIONS.BID_NOT_FOUND);
      } else {
        await Bids.update(
          {
            coverLetter: bidCoverLetter,
            bidProfileFreelancer,
            bidProfileAgency,
            bidProfileBusinessManager,
            boosted,
            bidResponse,
            status: bidResponse ? BidStatus.ACTIVE : BidStatus.PENDING,
            proposedProfile: profile,
            proposedRate: rate,
            receivedAmount,
            responseDate: response && response.date ? new Date(response.date) : null,
            bidQuestionAnswers: bidQuestions,
            invite,
            isManual,
            contractDate,
          },
          {
            where: {
              upworkProposalURL: {
                [Op.like]: `%${bidURLNumber}`,
              },
            },
          }
        );
      }

      let message: IMessage[] = [{ success: true, message: bidsMessages.leadSynced }];

      if (bidResponse) {
        await this.createIntegrationEnteries({
          bid, bidDto, bidURLNumber, client, job, jobSkills, message, user
        })
      } else {
        message.push({ success: false, message: bidsMessages.bidResponseNotFound });
      }

      await this.dealLogsService.createDealLog(user.id, {
        bidId: bid.id,
        dealLogType: DEAL_LOG_TYPE.LEAD_SYNCED,
        message: 'Lead Synced',
        userId: user.id,
      } as CreateDealLogDto);

      return {
        message,
        bid,
      };
    } catch (err: any) {
      console.error(err)
      if (err instanceof HttpException) throw err;
      else throw new InternalServerErrorException(err);
    }
  }

  public async resyncBid(user: Users, bidId: string, type: INTEGRATION_TYPES) {
    const bid = await Bids.findByPk(bidId, {
      include: [
        {
          model: Jobs,
          include: [
            {
              model: Accounts
            }
          ]
        }
      ]
    })

    if (!bid) throw new NotFoundException(bidsMessages.bidNotFound)

    const client: IClient = {
      name: bid.contact.name,
      timeZone: bid.contact.timeZone,
      upworkPlus: bid.contact.upworkPlus,
      paymentMethod: bid.contact.paymentMethod,
      rating: bid.contact.rating,
      location: {
        country: bid.contact.locationCountry,
        state: bid.contact.locationState
      },
      history: {
        proposals: bid.contact.historyProposals,
        interviews: bid.contact.historyInterviews,
        jobsPosted: bid.contact.historyJobsPosted,
        totalSpent: bid.contact.historyTotalSpent,
        hoursBilled: bid.contact.historyHoursBilled,
        openJobs: bid.contact.historyOpenJobs,
        hires: bid.contact.historyHires,
        hired: bid.contact.historyHired,
      }
    };
    const bidDto: BidDto = {
      bidCoverLetter: bid.coverLetter,
      bidProfile: bid.bidProfileId,
      bidProfileFreelancer: bid.bidProfileFreelancer ?? undefined,
      bidProfileAgency: bid.bidProfileAgency ?? undefined,
      bidProfileBusinessManager: bid.bidProfileBusinessManager ?? undefined,
      bidURL: bid.upworkProposalURL,
      connects: bid.connects,
      boosted: bid.boosted,
      response: bid.responseDate ? { date: new Date(bid.responseDate) } : null,
      bidTime: new Date(bid.dateTime),
      bidQuestions: bid.bidQuestionAnswers ? bid.bidQuestionAnswers.map(q => JSON.parse(q)) : undefined,
      rate: bid.proposedRate,
      receivedAmount: bid.receivedAmount ?? undefined,
      profile: bid.proposedProfile,
      bidResponse: bid.bidResponse,
      invite: bid.invite,
      migratedData: undefined, // Add this if there's relevant data to map.
      isManual: bid.isManual,
      contractDate: new Date(bid.contractDate),
      jobObjId: bid.jobId,
      jobId: bid.jobId,
      contactId: bid.contactId,
    };
    const bidder = await Users.findByPk(bid.userId)
    const profile = await Profiles.findByPk(bid.bidProfileId)

    let resyncedData: any = {}

    if (type === INTEGRATION_TYPES.CLICKUP) {

      if (!bid.clickupTaskId) throw new NotFoundException(clickUpMessages.clickupTaskNotCreatedForBid)

      resyncedData = await this.integrationService.updateClickUpTask(
        getUpworkRestatFields({
          client,
          job: bid.job,
          bidDto,
          bidder,
          profile
        }),
        user.companyId,
        bid.clickupTaskId
      )
    }

    if (type === INTEGRATION_TYPES.HUBSPOT) {

      if (!bid.hubspotDealId) throw new NotFoundException(hubspotMessages.hubspotNotCreatedForBid)

      resyncedData = await this.integrationServiceHubspot.updateHubspotEntities(
        getUpworkRestatFields({ bidder, bidDto, client, job: bid.job, profile }),
        user.companyId,
        INTEGRATION_OPTION.UPWORK,
        bid.contact.hubspotContactId,
        bid.hubspotDealId,
        // bid.job.account.hubspotCompanyId,
      )
    }

    return { resyncedData }
  }

  public async addDeal(user: Users, bidDto: BidDto, client: IClient, job: Jobs, jobSkills: string[]) {
    const {
      bidProfile,
      bidCoverLetter,
      bidProfileFreelancer,
      bidProfileAgency,
      bidProfileBusinessManager,
      bidURL,
      boosted,
      bidResponse,
      profile,
      rate,
      receivedAmount,
      response,
      bidTime,
      bidQuestions,
      invite,
      isManual,
      contractDate,
      jobId,
      contactId,
      connects,
    } = bidDto;


    if (!bidResponse) {
      throw new ConflictException(bidsMessages.bidResponseNotFound);
    }

    const cleanBidURL = bidURL.includes("?") ? bidURL.split("?")[0] : bidURL;
    const bidURLNumber = cleanBidURL.replace(/^.*\//, '');
    let bid = await Bids.findOne({
      where: {
        upworkProposalURL: {
          [Op.like]: `%${bidURLNumber}`,
        },
      },
    });

    try {
      if (!bid) {
        // throw new NotFoundException(bidsMessages.bidNotFound);
        bid = await Bids.create({
          jobId,
          userId: user.id,
          bidProfileId: bidProfile,
          contactId,
          upworkProposalURL: cleanBidURL,
          coverLetter: bidCoverLetter,
          bidProfileFreelancer,
          bidProfileAgency,
          bidProfileBusinessManager,
          connects,
          boosted,
          bidResponse,
          status: BidStatus.COMPLETED,
          proposedProfile: profile,
          proposedRate: rate,
          receivedAmount,
          responseDate: response && response.date ? new Date(response.date) : null,
          bidQuestionAnswers: bidQuestions,
          dateTime: bidTime,
          invite,
          isManual,
          contractDate,
        });
      } else {
        await Bids.update(
          {
            bidProfileId: bidProfile,
            coverLetter: bidCoverLetter,
            bidProfileFreelancer,
            bidProfileAgency,
            bidProfileBusinessManager,
            boosted,
            bidResponse,
            status: BidStatus.COMPLETED,
            proposedProfile: profile,
            proposedRate: rate,
            receivedAmount,
            responseDate: response.date,
            bidQuestionAnswers: bidQuestions,
            dateTime: bidTime,
            invite,
            isManual,  // Added handling for isManual
            contractDate,
          },
          {
            where: {
              upworkProposalURL: {
                [Op.like]: `%${bidURLNumber}`,
              },
            },
          }
        );
      }

      let message: IMessage[] = [{ success: true, message: bidsMessages.contractedSynced }];

      if (bidResponse) {
        await this.createIntegrationEnteries({
          bid, bidDto, bidURLNumber, client, job, jobSkills, message, user
        })
      } else {
        message.push({ success: false, message: bidsMessages.bidResponseNotFound });
      }

      await this.dealLogsService.createDealLog(user.id, {
        bidId: bid.id,
        dealLogType: DEAL_LOG_TYPE.JOB_CREATED,
        message: 'Contract Synced',
        userId: user.id,
      } as CreateDealLogDto);



      return {
        message,
        bid,
      };
    } catch (err) {
      console.error('Error occurred in addDeal', err)
      if (err instanceof HttpException) throw err;
      else throw new InternalServerErrorException(err);

    }
  }

  public async getLoggedinBiddersBids(userId: string, page: number) {
    try {
      const bidsPerPage = 20;
      const offset = (page - 1) * bidsPerPage;

      const options: any = {
        where: { userId },
        offset,
        limit: bidsPerPage,
        order: [["createdAt", "DESC"]],
      };
      const bids = await Bids.findAll(options);
      let bidsCount = await Bids.count({
        where: options.where,
      });
      return {
        message: bidsMessages.getAllBids,
        bids,
        bidsPerPage,
        bidsCount,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(bidsMessages.allBidsFetchedError);
    }
  }

  public async getAllBiddersJobsIds(userId: string, profile?: string) {
    try {
      let bids: any[] = [];
      if (profile) {
        bids = await Bids.findAll({
          where: { userId, bidProfileId: profile },
        });
      } else {
        bids = await Bids.findAll({
          where: { userId },
        });
      }
      const jobsIds = bids.map((bid: any) => bid.jobId);
      return {
        message: bidsMessages.biddersJobdsIdFetched,
        jobsIds,
      };
    } catch (err) {
      throw new InternalServerErrorException(bidsMessages.biddersJobIdsError);
    }
  }

  public async getAllCompanyJobsIds(userIds: any, profile?: any) {
    try {
      let bids: any[] = [];
      if (profile) {
        bids = await Bids.findAll({
          where: { userId: userIds, bidProfileId: profile },
          attributes: ["jobId"],
        });
      } else {
        bids = await Bids.findAll({
          where: { userId: userIds },
          attributes: ["jobId"],
        });
      }
      const jobsIds = bids.map((bid: any) => bid.jobId);
      return {
        message: bidsMessages.companysJobIdsFetched,
        jobsIds,
      };
    } catch (err) {
      throw new InternalServerErrorException(bidsMessages.companysJobIdsError);
    }
  }

  public async getCompanyBids(userIds: string[], page: number) {
    try {
      const bidsPerPage = 20;
      const offset = (page - 1) * bidsPerPage;

      const options: any = {
        where: { userId: userIds },
        offset,
        limit: bidsPerPage,
        order: [["createdAt", "DESC"]],
      };
      const bids = await Bids.findAll(options);
      let bidsCount = await Bids.count({
        where: options.where,
      });

      return {
        message: "success",
        bids,
        bidsPerPage,
        bidsCount,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        "Something went wrong while retrieving the bids"
      );
    }
  }

  public async getAllBids() {
    try {
      const bids = await Bids.findAll();
      return {
        message: bidsMessages.allBidsFetched,
        bids,
      };
    } catch (err) {
      throw new InternalServerErrorException(bidsMessages.allBidsFetchedError);
    }
  }

  public async getBidById(workspaceId: string, id: string) {
    const bid = await Bids.findOne({ where: { id } });
    if (!bid) {
      throw new NotFoundException(bidsMessages.bidNotFound);
    }
    const { job, tags, account } = await this.jobAccountService.getJobById(workspaceId, bid.jobId);
    return {
      message: bidsMessages.bidByIdFetched,
      bid,
      job,
      tags,
      account,
    };
  }

  public async deleteBidById(bidId: string) {
    const bid = await Bids.findOne({ where: { id: bidId } });
    if (!bid) {
      throw new NotFoundException(bidsMessages.bidNotFound);
    }
    await Bids.destroy({ where: { id: bidId } });
    return {
      message: bidsMessages.bidDeleted,
    };
  }

  async countBids(
    userId: string,
    monthStart: string,
    dayStart: string,
    dayEnd: string
  ): Promise<{ bidMonthlyCountByBidder: number, bidDailyCountByBidder: number, leadMonthlyCountByBidder: number, leadDailyCountByBidder: number }> {
    const bidMonthlyCountByBidder = await Bids.count({
      where: {
        userId,
        invite: false,
        createdAt: {
          [Op.gte]: monthStart ?? moment().startOf("month").toDate(),
        },
      },
    });
    const leadMonthlyCountByBidder = await Bids.count({
      where: {
        userId,
        bidResponse: true,
        status: BidStatus.ACTIVE,
        isManual: false,
        invite: false,
        createdAt: {
          [Op.gte]: monthStart ?? moment().startOf("month").toDate(),
        },
      },
    });

    const bidDailyCountByBidder = await Bids.count({
      where: {
        userId,
        invite: false,
        createdAt: {
          [Op.gte]: dayStart ?? moment().startOf("day").toDate(),
          [Op.lte]: dayEnd ?? moment().endOf("day").toDate(),
        },
      },
    });

    const leadDailyCountByBidder = await Bids.count({
      where: {
        userId,
        bidResponse: true,
        status: BidStatus.ACTIVE,
        isManual: false,
        invite: false,
        createdAt: {
          [Op.gte]: dayStart ?? moment().startOf("day").toDate(),
          [Op.lte]: dayEnd ?? moment().endOf("day").toDate(),
        },
      },
    });

    return { bidMonthlyCountByBidder, bidDailyCountByBidder, leadMonthlyCountByBidder, leadDailyCountByBidder };
  }

  public async updateBidDetails(bidDetailsDto: UpdateBidDto, bidId: string, userId: string) {
    this.dealLogMessage = [];
    const user = await Users.findOne({ where: { id: userId } })
    const bid = await Bids.findByPk(bidId, {
      include: [
        {
          model: Profiles,
          attributes: ["name"],
        },
        {
          model: Users,
          attributes: ['name']
        }
      ],
      paranoid: false
    });

    if (!bid) {
      throw new NotFoundException(bidsMessages.bidNotFound);
    }

    const oldBid = bid.toJSON()

    bid.bidProfileId = bidDetailsDto.bidProfileId || bid.bidProfileId;
    bid.userId = bidDetailsDto.bidUserId || bid.userId;
    bid.status = bidDetailsDto.status as BidStatus || bid.status;

    if (oldBid.status != bidDetailsDto.status && bidDetailsDto.status === BidStatus.PENDING) {
      bid.bidResponse = false
      bid.contractDate = null
      bid.responseDate = null
      await this.dealLogsService.createDealLog(userId, {
        bidId: bid.id,
        dealLogType: DEAL_LOG_TYPE.BID_UPDATED,
        message: 'Proposal Synced Manually',
        userId,
      } as CreateDealLogDto);
    }

    if (oldBid.status != bidDetailsDto.status && bidDetailsDto.status === BidStatus.ACTIVE) {
      bid.bidResponse = true
      bid.contractDate = null
      bid.responseDate = bidDetailsDto.responseDate ? moment(bidDetailsDto.responseDate).toDate() : moment().toDate()
      await this.dealLogsService.createDealLog(userId, {
        bidId: bid.id,
        dealLogType: DEAL_LOG_TYPE.LEAD_SYNCED,
        message: 'Lead Synced Manually',
        userId,
      } as CreateDealLogDto);


    }

    if (oldBid.status != bidDetailsDto.status && bidDetailsDto.status === BidStatus.COMPLETED) {
      bid.bidResponse = true
      bid.contractDate = bidDetailsDto.contractDate ? moment(bidDetailsDto.contractDate).toDate() : moment().toDate()
      await this.dealLogsService.createDealLog(userId, {
        bidId: bid.id,
        dealLogType: DEAL_LOG_TYPE.JOB_CREATED,
        message: 'Contract Synced Manually',
        userId,
      } as CreateDealLogDto);
    }

    if (oldBid['bidProfileId'] !== bidDetailsDto['bidProfileId']) {
      const profileName = await Profiles.findByPk(bidDetailsDto.bidProfileId);
      this.dealLogMessage.push(`Business Manager changed from '${oldBid?.bidProfile?.name}' to '${profileName?.name}'`)
    }
    if (bidDetailsDto['bidUserId'] && oldBid['userId'] !== bidDetailsDto['bidUserId']) {
      const userName = await Users.findByPk(bidDetailsDto.bidUserId);
      this.dealLogMessage.push(`Account Manager changed from '${oldBid?.user?.name}' to '${userName?.name}'`)
    }

    const { contact } = await this.contactService.updateContact(bidDetailsDto.contact.id, bidDetailsDto.contact, this.dealLogMessage);
    const { job } = await this.updateJob(bidDetailsDto.job.id, bidDetailsDto.job);

    await bid.save();

    // Logging
    this.dealLogMessage.length && await this.dealLogsService.createDealLog(userId, {
      bidId: bid.id,
      dealLogType: DEAL_LOG_TYPE.FIELD_UPDATED,
      message: JSON.stringify(this.dealLogMessage),
      userId,
    } as CreateDealLogDto);

    const { message } = await this.createIntegratedEnteriesForDirectLeads({ bid, contact, job, user });

    return {
      message: formatMessages([{ success: true, message: bidsMessages.bidUpdated }, ...message]),
      bidDetailsDto,
      bid
    }
  }

  public async updateJob(jobId: string, jobDto: UpdateJobDto): Promise<{ job: Jobs }> {
    const job = await Jobs.findByPk(jobId,
      {
        attributes: [
          'id',
          'experienceLevel',
          'hourly',
          'hourlyRange',
          'projectLength',
        ]
      }
    );
    if (!job) {
      throw new NotFoundException(bidsMessages.jobNotFound);
    }
    const oldJob = job?.toJSON()
    await job.update({ ...jobDto });

    Object.keys(jobDto).forEach(key => {
      if (oldJob[key as keyof UpdateJobDto] !== jobDto[key as keyof UpdateJobDto] && oldJob?.hasOwnProperty(key)) {
        this.dealLogMessage.push(`'${key}' of Job changed from '${oldJob[key as keyof UpdateJobDto]}' to '${jobDto[key as keyof UpdateJobDto]}'`)
      }
    })
    return {
      job
    }
  }

  public async createIntegratedEnteriesForDirectLeads({ user, bid, contact, job }: { user: Users, bid: Bids, contact: Contacts, job: Jobs }): Promise<{ message: IMessage[] }> {
    let message: IMessage[] = [];

    if (bid.bidResponse) {
      const profile = await Profiles.findByPk(bid.bidProfileId, {paranoid: false})
      const bidder = await Users.findByPk(bid.userId, {paranoid: false})

      if (bid.clickupTaskId) {
        message.push({ success: true, message: clickUpMessages.clickupTaskAlreadyExists(bid.clickupTaskId) });
      } else {
        // Create ClickUp task
        const clickUpTask = await this.integrationService.createClickUpTask(
          {
            ...getUpworkRestatFieldsForManualBid({ bidder, bidDto: bid, client: contact, job, profile }),
            priority: 3,
            notify_all: true,
          },
          user.companyId,
        );

        if (clickUpTask.status) {
          bid.clickupTaskId = clickUpTask.data?.id
          await bid.save();

          await this.dealLogsService.createDealLog(user.id, {
            bidId: bid.id,
            dealLogType: DEAL_LOG_TYPE.CLICKUP_TASK_CREATED,
            message: `ClickUp Task created with ID '${clickUpTask.data?.id}'`,
            userId: user.id,
          } as CreateDealLogDto);
        }
        clickUpTask.message && message.push({ success: clickUpTask.status, message: clickUpTask.message });
      }

      if (bid.hubspotDealId) {
        message.push({ success: true, message: hubspotMessages.hubspotbyIdAlreadyExists(bid.hubspotDealId) });
      } else {
        // Create Hubspot Enteries
        const hubspotDeal = await this.integrationServiceHubspot.createHubspotEntities(
          getUpworkRestatFieldsForManualBid({ bidder, bidDto: bid, client: contact, job, profile }),
          user.companyId,
          INTEGRATION_OPTION.UPWORK
        )

        if (hubspotDeal.status) {
          await bid.update({ hubspotDealId: hubspotDeal.data?.dealId, hub_id: hubspotDeal.data?.hub_id });

          contact.hubspotContactId = hubspotDeal.data?.contactId
          await contact.save()

          await this.dealLogsService.createDealLog(user.id, {
            bidId: bid.id,
            dealLogType: DEAL_LOG_TYPE.HUBSPOT_DEAL_CREATED,
            message: `Hubspot Deal created with ID '${hubspotDeal.data?.dealId}'`,
            userId: user.id,
          } as CreateDealLogDto);
        }

        hubspotDeal.message && message.push({ success: hubspotDeal.status, message: hubspotDeal.message });
      }
    }

    return { message }
  }

  public async createIntegrationEnteries(
    { bid, bidDto, client, job, message, jobSkills, user, bidURLNumber }
      :
      {
        bid: Bids,
        message: IMessage[],
        bidDto: BidDto,
        client: IClient,
        job: Jobs,
        user: Users,
        jobSkills: string[],
        bidURLNumber: string,
      }) {
    const profile = await Profiles.findByPk(bid.bidProfileId)
    const bidder = await Users.findByPk(bid.userId)

    if (bid.clickupTaskId) {
      message.push({ success: true, message: clickUpMessages.clickupTaskAlreadyExists(bid.clickupTaskId) });
    } else {
      // Create ClickUp task
      const clickUpTask = await this.integrationService.createClickUpTask(
        {
          ...getUpworkRestatFields({ bidder, bidDto, client, job, profile }),
          priority: 3,
          // assignees: [+bidder.clickupId],
          notify_all: true,
          tags: jobSkills,
        },
        user.companyId
      );

      if (clickUpTask.status) {
        await Bids.update({ clickupTaskId: clickUpTask.data?.id },
          {
            where: {
              upworkProposalURL: {
                [Op.like]: `%${bidURLNumber}`,
              },
            },
          }
        );

        await this.dealLogsService.createDealLog(user.id, {
          bidId: bid.id,
          dealLogType: DEAL_LOG_TYPE.CLICKUP_TASK_CREATED,
          message: clickUpMessages.clickUpTaskCreatedById(clickUpTask.data?.id),
          userId: user.id,
        } as CreateDealLogDto);
      }
      clickUpTask.message && message.push({ success: clickUpTask.status, message: clickUpTask.message });
    }

    if (bid.hubspotDealId) {
      message.push({ success: true, message: hubspotMessages.hubspotbyIdAlreadyExists(bid.hubspotDealId) });
    } else {
      // Create Hubspot Enteries
      const hubspotDeal = await this.integrationServiceHubspot.createHubspotEntities(
        getUpworkRestatFields({ bidder, bidDto, client, job, profile }),
        user.companyId,
        INTEGRATION_OPTION.UPWORK
      )

      if (hubspotDeal.status) {
        await Bids.update({ hubspotDealId: hubspotDeal.data?.dealId, hub_id: hubspotDeal.data?.hub_id },
          {
            where: {
              upworkProposalURL: {
                [Op.like]: `%${bidURLNumber}`,
              },
            },
          }
        );

        const contact = await Contacts.findByPk(bid.contactId)
        if (!contact) throw new NotFoundException(contactsMessages.contactNotFound)
        contact.hubspotContactId = hubspotDeal.data?.contactId
        await contact.save()

        await this.dealLogsService.createDealLog(user.id, {
          bidId: bid.id,
          dealLogType: DEAL_LOG_TYPE.HUBSPOT_DEAL_CREATED,
          message: hubspotMessages.hubspotContactCreatedById(hubspotDeal?.data?.dealId),
          userId: user.id,
        } as CreateDealLogDto);
      }

      hubspotDeal.message && message.push({ success: hubspotDeal.status, message: hubspotDeal.message });
    }

  }

}
