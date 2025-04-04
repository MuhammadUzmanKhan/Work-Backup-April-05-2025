import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Accounts } from "src/common/models/accounts.model";
import { EXCEPTIONS } from "src/common/constants/exceptions";
import { Sequelize } from "sequelize";
import { ConfigService } from "@nestjs/config";
import pg from "pg";
import { ClientDto } from "./dto/updateEmail.dto";
import { accountsMessages } from "src/common/constants/messages";


@Injectable()
export class AccountService {
  constructor(private readonly configService: ConfigService) { }
  public async getAccountById(accountId: string) {
    const account = await Accounts.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(EXCEPTIONS.ACCOUNT_NOT_FOUND);
    }
    return {
      message: accountsMessages.accountByIdFetched,
      account,
    };
  }

  public async updateAccountData(accountId: string, ClientDto: ClientDto) {
    const { account } = await this.getAccountById(accountId)
    account.email = ClientDto.email
    account.name = ClientDto.name
    account.company = ClientDto.company
    account.timeZone = ClientDto.timeZone
    account.upworkPlus = ClientDto.upworkPlus
    account.paymentMethod = ClientDto.paymentMethod
    account.rating = ClientDto.rating
    account.locationCountry = ClientDto.location?.country ?? account.locationCountry;
    account.locationState = ClientDto.location?.state ?? account.locationState;
    account.numberOfEmployees = ClientDto.numberOfEmployees
    account.designation = ClientDto.designation
    account.industry = ClientDto.industry
    account.companyAge = ClientDto.companyAge
    account.funding = ClientDto.funding
    account.currentInterview = ClientDto.currentInterview
    account.decisionMaker = ClientDto.decisionMaker
    account.socialMediaHandles = {
      ...account.socialMediaHandles,
      Facebook: ClientDto.socialMediaHandles?.Facebook,
      Twitter: ClientDto.socialMediaHandles?.Twitter,
      Linkedin: ClientDto.socialMediaHandles?.Linkedin,
    };
    account.specialInterest = ClientDto.specialInterest
    account.clientsExperience = {
      totalYears: ClientDto.clientsExperience?.totalYears ?? account.clientsExperience.totalYears,
      organizationName: ClientDto.clientsExperience?.organizationName ?? account.clientsExperience.organizationName,
      jobTitles: ClientDto.clientsExperience?.jobTitles ?? account.clientsExperience.jobTitles,
    };
    account.save()
    return {
      message: accountsMessages.accountUpdated,
      account,
    }
  }

  public async getAccountState() {
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
      SELECT "locationCountry", COUNT(*) AS count, ARRAY_AGG(id) AS accountIds
      FROM accounts
      GROUP BY "locationCountry"
      `);
      return results[0];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        accountsMessages.accountStateError
      );
    }
  }

}
