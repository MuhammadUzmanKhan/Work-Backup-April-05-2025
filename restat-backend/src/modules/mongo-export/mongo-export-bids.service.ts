// src/services/mongo-export.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MongoClient, MongoClientOptions } from "mongodb";
import * as fs from "fs/promises";
import * as path from "path";
import { Users } from "src/common/models/users.model";
import { ConfigService } from "@nestjs/config";
import { Profiles } from "src/common/models/profiles.model";
import { SOURCE } from "src/common/constants/source";
import { AccountJobBidService } from "../accounts/account-bid-job.service";
@Injectable()
export class MongoExportBidsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly accountJobBidService: AccountJobBidService
  ) { }
  private readonly mongoUrl = this.configService.get("MONGO_URL");

  async exportBidsData(pageNumber: number) {
    const clientOptions: MongoClientOptions = {};
    const client = new MongoClient(this.mongoUrl, clientOptions);

    try {
      await client.connect();
      const collectionName = "bids";
      const collection = client.db().collection(collectionName);
      const pageSize = 100;
      const skipValue = (pageNumber - 1) * pageSize;

      const data = await collection
        .find()
        .skip(skipValue)
        .limit(pageSize)
        .toArray();

      const fileName = `${collectionName}.json`;
      await fs.writeFile(fileName, JSON.stringify(data, null, 2));
      const currentDir = __dirname;
      const targetDir = path.resolve(currentDir, "..", "..", "..");
      const fullPathToFile = path.join(targetDir, fileName);
      await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
      const jsonData = await fs.readFile(fullPathToFile, "utf-8");
      const bidsData = JSON.parse(jsonData);
      const uniqueBidURLs = new Set();
      for (const bidData of bidsData) {
        // Check if bidURL is already in the set
        if (uniqueBidURLs.has(bidData.bidURL)) {
          continue; // Skip processing duplicate bidURL, move to next iteration
        }

        // Add bidURL to the set
        uniqueBidURLs.add(bidData.bidURL);
        let user = await Users.findOne({
          where: {
            email: bidData.bidder,
          },
        });
        let theBidProfile = await Profiles.findOne({
          where: {
            name: bidData.bidProfile,
            source: SOURCE.UPWORK,
          },
        });
        if (user && theBidProfile) {
          const bidProfile = theBidProfile.id;
          const bidder = user.id;
          delete bidData.bidProfile;
          delete bidData.bidder;
          const theBidData = {
            bidProfile,
            bidder,
            ...bidData,
          };
          const {
            bidCoverLetter,
            bidQuestionsAnswer,
            bidTime,
            bidURL,
            clientCompany,
            bidConnects,
            bidBoosted,
            clientHistoryHires,
            clientHistoryHired,
            clientHistoryHoursBilled,
            clientHistoryInterviews,
            clientHistoryJobsPosted,
            clientHistoryMemeberJoined,
            clientHistoryOpenJobs,
            clientHistoryProposals,
            clientHistoryTotalSpent,
            clientLocationCountry,
            clientLocationState,
            clientemail,
            clientName,
            clientPaymentMethod,
            clientRating,
            clientUpworkPlus,
            jobExperienceLevel,
            jobHourlyRange,
            jobHourly,
            jobProjectLengthDuration,
            jobProposeYourTerms,
            jobFeaturedJob,
            jobCategories,
            jobDescription,
            jobSkills,
            jobTitle,
            jobURL,
            jobPosted,
            bidResponse,
            jobInvite,
            jobInviteOnly,
            bidProposedProfile,
            bidProposedRate,
            bidResponseDate,
            job,
            createdAt,
            updatedAt,
          } = theBidData;
          const jobAttributes = {
            experienceLevel: jobExperienceLevel,
            hourlyRange: jobHourlyRange,
            hourly: jobHourly,
            projectLengthDuration: jobProjectLengthDuration,
            featuredJob: jobFeaturedJob,
            proposeYourTerms: jobProposeYourTerms,
          };
          const jobDetails = {
            jobTitle,
            jobCategories,
            jobDescription,
            jobSkills,
            jobAttributes,
            jobPosted,
            jobURL,
            inviteOnly: jobInviteOnly,
          };
          const proposedTerms = {
            profile: bidProposedProfile,
            rate: bidProposedRate,
          };
          const location = {
            country: clientLocationCountry,
            state: clientLocationState,
          };
          const history = {
            proposals: clientHistoryProposals,
            interviews: clientHistoryInterviews,
            jobsPosted: clientHistoryJobsPosted,
            totalSpent: clientHistoryTotalSpent,
            hoursBilled: clientHistoryHoursBilled,
            openJobs: clientHistoryOpenJobs,
            hires: clientHistoryHires,
            hired: clientHistoryHired,
            memeberJoined: clientHistoryMemeberJoined,
          };
          const client = {
            company: clientCompany,
            history,
            location,
            name: clientName,
            paymentMethod: clientPaymentMethod,
            rating: clientRating,
            upworkPlus: clientUpworkPlus,
            email: clientemail
          };

          const response = {
            date: bidResponseDate ? bidResponseDate : null,
          };
          const accountData = {
            accountDto: {
              bid: {
                bidProfile,
                jobDetails,
                bidCoverLetter,
                bidURL,
                bidProfileInfo: {},
                connects: bidConnects,
                boosted: bidBoosted,
                bidResponse,
                invite: jobInvite,
                bidQuestions: bidQuestionsAnswer,
                proposedTerms,
                client,
                bidTime,
                response,
                jobObjId: job,
                createdAt,
                updatedAt,
                migratedData: true
              },
            },
          };
          await this.accountJobBidService.syncProposal(bidder, user.companyId, accountData);
        }
      }
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        "Something went wrong while retrieving the data"
      );
    } finally {
      await client.close();
    }
  }
}
