import {
  Injectable,
  InternalServerErrorException,
  ParseUUIDPipe,
} from "@nestjs/common";
import { AccountDto } from "./dto/accounts.dto";
import { Accounts } from "src/common/models/accounts.model";
import { JobService } from "../jobs/jobs.service";
import { BidService } from "../bids/bids.service";
import { Users } from "src/common/models/users.model";
import { Op, Sequelize } from "sequelize";
import { ROLES } from "src/common/constants/roles";
import { DynamicModelsProvider } from "src/common/mongo-collections/dynamic-models.provider";
import { SOURCE } from "src/common/constants/source";
import * as moment from "moment";
import { ContactService } from "../contacts/contacts.service";
import { formatMessages } from "src/common/helpers";
import { CompaniesService } from "../companies/companies.service";
import { CreateManualBidDto } from "../bids/dto/manual-bids.dto";
import { accountsMessages } from "src/common/constants/messages";

@Injectable()
export class AccountJobBidService {
  constructor(
    private readonly jobService: JobService,
    private readonly bidService: BidService,
    private readonly dynamicModelsProvider: DynamicModelsProvider,
    private readonly contactService: ContactService,
    private readonly companiesService: CompaniesService,
  ) { }

  public async syncRawHtml(bidUrl: string, userId: string, bidProfile: string, rawHtml: string) {
    const companiesModel = this.dynamicModelsProvider.getCompaniesModel();
    const existingDocument = await companiesModel.findOne({ bidUrl }).exec();
    if (existingDocument) {
      existingDocument.rawHtml = rawHtml;
      await existingDocument.save();
    } else {
      await companiesModel.create({
        source: SOURCE.UPWORK,
        bidUrl,
        userId,
        bidProfile,
        rawHtml
      });
    }
  }

  public async createManualBid(user: Users, bidDto: CreateManualBidDto) {
    // 1: Create OR Find Job
    const { job, message: jobMessage } = await this.jobService.createManualJob(bidDto);

    // 2: Create OR Find Contact
    const { contact, message: contactMessage } = await this.contactService.createManualContact(user.id, user.companyId, job.id, bidDto)

    // 3: Create Bid
    const { message: bidMessage } = await this.bidService.createManualBid(user, contact.id, job, contact, bidDto);

    return {
      message: formatMessages([
        { success: true, message: jobMessage },
        { success: true, message: contactMessage },
        { success: true, message: bidMessage }
      ]),
    };
  }

  public async syncProposal(
    userId: string,
    workspaceId: string,
    { accountDto }: { accountDto: AccountDto }
  ) {
    let {
      bidProfile,
      jobDetails,
      bidCoverLetter,
      bidURL,
      bidProfileInfo,
      connects,
      boosted,
      bidResponse,
      response,
      bidTime,
      client,
      bidQuestions,
      proposedTerms,
      invite,
      jobObjId,
      migratedData,
      rawHtml
    } = accountDto.bid;
    if (rawHtml) {
      this.syncRawHtml(bidURL, userId, bidProfile, rawHtml)
    }
    const { profile, rate, receivedAmount } = proposedTerms;
    const { freelancer, agency, businessManager } = bidProfileInfo || {};

    connects = !connects ? '0' : connects;
    const bidDetails = {
      bidProfile,
      bidProfileFreelancer: freelancer ?? null,
      bidProfileAgency: agency ?? null,
      bidProfileBusinessManager: businessManager ?? null,
      bidCoverLetter,
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
    };

    const {
      history,
      location,
      name,
      timeZone,
      paymentMethod,
      rating,
      upworkPlus,
      designation,
      currentInterview,
      decisionMaker,
    } = client;

    const { country, state } = location;

    const {
      proposals,
      interviews,
      jobsPosted,
      totalSpent,
      hoursBilled,
      openJobs,
      hires,
      hired,
      memberJoined,
      hireRate,
      avgHourlyRate,
    } = history;

    const contactDetails = {
      name,
      timeZone,
      source: SOURCE.UPWORK,
      locationCountry: country,
      locationState: state,
      historyProposals: proposals,
      historyInterviews: interviews,
      historyJobsPosted: jobsPosted,
      historyTotalSpent: totalSpent,
      historyHoursBilled: hoursBilled,
      historyOpenJobs: openJobs,
      historyHires: hires,
      historyHired: hired,
      historyMemberJoined: memberJoined ? moment(memberJoined).toDate() : null,
      historyHireRate: hireRate,
      historyAvgHourlyRate: avgHourlyRate,
      rating,
      upworkPlus,
      designation,
      decisionMaker,
      paymentMethod,
      currentInterview,
    }

    // 1: Create OR Find Job
    const { job, message: jobMessage, isAlreadyExist: isJobAlreadyExist } = await this.jobService.createOrFindJob(workspaceId, jobDetails);
    if (isJobAlreadyExist) {
      await this.jobService.updateJob(workspaceId, jobDetails);
    }

    // 2: Create OR Find Contact
    const { contact, message: contactMessage, isAlreadyExist: isContactAlreadyExist } = await this.contactService.createOrFindContactOfWorkspace(userId, workspaceId, job.id, contactDetails)
    if (isContactAlreadyExist) {
      await this.contactService.updateContactOfWorkspace(userId, workspaceId, job.id, {
        name,
        timeZone,
        locationCountry: country,
        locationState: state,
        historyProposals: proposals,
        historyInterviews: interviews,
        historyJobsPosted: jobsPosted,
        historyTotalSpent: totalSpent,
        historyHoursBilled: hoursBilled,
        historyOpenJobs: openJobs,
        historyHires: hires,
        historyHired: hired,
        historyMemberJoined: memberJoined ? moment(memberJoined).toDate() : null,
        paymentMethod,
        rating,
        upworkPlus,
      })
    }

    // 3: Create Bid
    const { bid, message: bidMessage } = await this.bidService.createBid(userId, contact.id, { ...bidDetails, jobId: job.id, contactId: contact.id });

    const { monthStart, dayStart, dayEnd } = accountDto
    const { bidDailyCountByBidder, bidMonthlyCountByBidder, leadDailyCountByBidder, leadMonthlyCountByBidder } = await this.bidService.countBids(userId, monthStart, dayStart, dayEnd)
    return {
      message: formatMessages([
        { success: true, message: jobMessage },
        { success: true, message: contactMessage },
        { success: true, message: bidMessage }
      ]),
      bidDailyCountByBidder,
      bidMonthlyCountByBidder,
      leadDailyCountByBidder,
      leadMonthlyCountByBidder,
      bid,
      job,
      contact,
    };
  }

  public async syncLead(
    { accountDto }: { accountDto: AccountDto },
    user: Users
  ) {
    let {
      bidProfile,
      jobDetails,
      bidCoverLetter,
      bidURL,
      bidProfileInfo,
      connects,
      boosted,
      bidResponse,
      response,
      bidTime,
      client,
      bidQuestions,
      proposedTerms,
      invite,
      jobObjId,
      rawHtml
    } = accountDto.bid;

    const { profile, rate, receivedAmount } = proposedTerms;
    const { freelancer, agency, businessManager } = bidProfileInfo || {};
    connects = !connects ? '0' : connects;

    const bidDetails = {
      bidProfile,
      bidProfileFreelancer: freelancer ? freelancer : null,
      bidProfileAgency: agency ? agency : null,
      bidProfileBusinessManager: businessManager ? businessManager : null,
      bidCoverLetter,
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
    };

    const {
      company,
      history,
      location,
      name,
      timeZone,
      paymentMethod,
      rating,
      upworkPlus,
      numberOfEmployees,
      designation,
      currentInterview,
      clientsExperience,
    } = client;

    const { country, state } = location;
    const {
      proposals,
      interviews,
      jobsPosted,
      totalSpent,
      hoursBilled,
      openJobs,
      hires,
      hired,
      memberJoined,
      hireRate,
      avgHourlyRate,
    } = history;

    const contactData = {
      name,
      timeZone,
      source: SOURCE.UPWORK,
      locationCountry: country,
      locationState: state,
      historyProposals: proposals,
      historyInterviews: interviews,
      historyJobsPosted: jobsPosted,
      historyTotalSpent: totalSpent,
      historyHoursBilled: hoursBilled,
      historyOpenJobs: openJobs,
      historyHires: hires,
      historyHired: hired,
      historyMemberJoined: memberJoined ? moment(memberJoined).toDate() : null,
      historyHireRate: hireRate,
      historyAvgHourlyRate: avgHourlyRate,
      paymentMethod,
      rating,
      upworkPlus,
      numberOfEmployees,
      designation,
      currentInterview,
      clientsExperience,
    }


    if (rawHtml) {
      this.syncRawHtml(bidURL, user.id, bidProfile, rawHtml)
    }

    // 1: Update Job
    const { job, message: jobMessage } = await this.jobService.updateJob(user.companyId, jobDetails);

    // 2: Update Contact
    const { contact, message: contactMessage } = await this.contactService.updateContactOfWorkspace(user.id, user.companyId, job.id, contactData)

    // 3: Update Bid
    const { bid, message: bidMessage } = await this.bidService.updateBid({ ...bidDetails, jobId: job.id, contactId: contact.id }, job, user, client, jobDetails.jobSkills);

    // 4: Create Or Find Company
    const { company: companyData, success: isCompanySuccess, message: companyMessage } = await this.companiesService.createOrFindContactCompany(user.companyId, contact.id, company)

    const { monthStart, dayStart, dayEnd } = accountDto
    const { bidDailyCountByBidder, bidMonthlyCountByBidder, leadDailyCountByBidder, leadMonthlyCountByBidder } = await this.bidService.countBids(user.id, monthStart, dayStart, dayEnd)

    return {
      message: formatMessages([
        { success: true, message: jobMessage },
        { success: true, message: contactMessage },
        { success: isCompanySuccess, message: companyMessage },
        ...bidMessage
      ]),
      bidDailyCountByBidder,
      bidMonthlyCountByBidder,
      leadDailyCountByBidder,
      leadMonthlyCountByBidder,
      job,
      contact,
      company: companyData,
      bid
    };
  }

  public async syncContract(
    { accountDto, user }: { accountDto: AccountDto, user: Users }
  ) {
    let {
      bidProfile,
      jobDetails,
      bidCoverLetter,
      bidURL,
      bidProfileInfo,
      connects,
      boosted,
      bidResponse,
      response,
      bidTime,
      client,
      bidQuestions,
      proposedTerms,
      invite,
      jobObjId,
      rawHtml
    } = accountDto.bid;

    const { profile, rate, receivedAmount } = proposedTerms;
    const { freelancer, agency, businessManager } = bidProfileInfo || {};
    connects = !connects ? '0' : connects;
    const bidDetails = {
      bidProfile,
      bidProfileFreelancer: freelancer ?? null,
      bidProfileAgency: agency ?? null,
      bidProfileBusinessManager: businessManager ?? null,
      bidCoverLetter,
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
    };
    const {
      company,
      history,
      location,
      name,
      timeZone,
      paymentMethod,
      rating,
      upworkPlus,
    } = client;
    const { country, state } = location;
    const {
      proposals,
      interviews,
      jobsPosted,
      totalSpent,
      hoursBilled,
      openJobs,
      hires,
      hired,
      memberJoined,
      hireRate,
      avgHourlyRate,
    } = history;

    const contactData = {
      name,
      timeZone,
      source: SOURCE.UPWORK,
      locationCountry: country,
      locationState: state,
      historyProposals: proposals,
      historyInterviews: interviews,
      historyJobsPosted: jobsPosted,
      historyTotalSpent: totalSpent,
      historyHoursBilled: hoursBilled,
      historyOpenJobs: openJobs,
      historyHires: hires,
      historyHired: hired,
      historyMemberJoined: memberJoined ? moment(memberJoined).toDate() : null,
      historyHireRate: hireRate,
      historyAvgHourlyRate: avgHourlyRate,
      paymentMethod,
      rating,
      upworkPlus,
    }

    if (rawHtml) {
      this.syncRawHtml(bidURL, user.id, bidProfile, rawHtml)
    }

    // 1: Update Job
    const { job, message: jobMessage } = await this.jobService.updateJob(user.companyId, jobDetails);

    // 2: Update Contact
    const { contact, message: contactMessage } = await this.contactService.updateContactOfWorkspace(user.id, user.companyId, job.id, contactData)

    // 3: Update Bid
    const { bid, message: bidMessage } = await this.bidService.addDeal(user, { ...bidDetails, jobId: job.id, contractDate: moment().toDate(), contactId: contact.id }, client, job, jobDetails.jobSkills,);

    // 4: Create Or Find Company
    const { company: companyData, success: isCompanySuccess, message: companyMessage } = await this.companiesService.createOrFindContactCompany(user.companyId, contact.id, company)

    const { monthStart, dayStart, dayEnd } = accountDto
    const { bidDailyCountByBidder, bidMonthlyCountByBidder, leadDailyCountByBidder, leadMonthlyCountByBidder } = await this.bidService.countBids(user.id, monthStart, dayStart, dayEnd)

    return {
      message: formatMessages([
        { success: true, message: jobMessage },
        { success: true, message: contactMessage },
        { success: isCompanySuccess, message: companyMessage },
        ...bidMessage
      ]),
      bidDailyCountByBidder,
      bidMonthlyCountByBidder,
      leadDailyCountByBidder,
      leadMonthlyCountByBidder,
      job,
      contact,
      company: companyData,
      bid
    };
  }

  public async getAllBiddersOrAdminAccounts(
    user: Users,
    search: string,
    profile: ParseUUIDPipe,
    bidder: string,
    page: number = 1,
    perPage: string = '20',
  ) {
    const accountsPerPage = +perPage;
    const offset = (page - 1) * accountsPerPage;

    let userIds: string[] = []
    userIds = await this.getUserIds(user, bidder)


    const whereClause = userIds && userIds.length > 0
      ? `WHERE "userId" IN (${userIds.map(id => `'${id}'`)}) ${profile ? `AND "bidProfileId" = '${profile}'` : ''}`
      : `WHERE 1 = 0`;

    try {
      const accountsOptions: any = {
        where: {
          id: {
            [Op.in]: Sequelize.literal(`(
              SELECT DISTINCT "accountId" FROM "jobs" 
              WHERE "id" IN (
                SELECT "jobId" FROM bids 
                ${whereClause}
              )
            )`),
          },
        },
        offset,
        limit: accountsPerPage,
        order: [["updatedAt", "DESC"]],
      };

      if (search) {
        accountsOptions.where[Op.or] = [
          {
            name: {
              [Op.iLike]: `%${search}%`, // Case-insensitive search in name
            },
          },
          {
            locationCountry: {
              [Op.iLike]: `%${search}%`, // Case-insensitive search in locationCountry
            },
          },
          {
            locationState: {
              [Op.iLike]: `%${search}%`, // Case-insensitive search in locationState
            },
          },
        ];
      }

      const accounts = await Accounts.findAll(accountsOptions);
      const accountsCount = await Accounts.count({
        where: accountsOptions.where,
      });

      return {
        message: accountsMessages.allAccountsFetched,
        page,
        accounts,
        accountsPerPage,
        accountsCount,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        accountsMessages.allAccountsFetchedError
      );
    }
  }

  async getUserIds(user: Users, bidderId?: string) {
    if (user.role === ROLES.BIDDER) {
      return [user.id]
    } else if (user.role === ROLES.COMPANY_ADMIN || user.role === ROLES.OWNER) {
      if (bidderId) {
        return [bidderId];
      }
      const users = await Users.findAll({
        where: {
          companyId: user.companyId,
          role: {
            [Op.in]: [ROLES.BIDDER, ROLES.COMPANY_ADMIN, ROLES.OWNER]
          }
        },
        attributes: ['id'],
        paranoid: false,
      });
      return users?.map((user: Users) => user.id)
    } else return []
  }
}
