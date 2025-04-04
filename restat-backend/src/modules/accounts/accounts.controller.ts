import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AccountDto } from "./dto/accounts.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";
import { AccountJobBidService } from "./account-bid-job.service";
import { AccountService } from "./accounts.service";
import { ClientDto } from "./dto/updateEmail.dto";
import { CreateManualBidDto } from "../bids/dto/manual-bids.dto";

@Controller("accounts")
export class AccountController {
  constructor(
    private readonly accountJobBidService: AccountJobBidService,
    private readonly accountService: AccountService
  ) { }

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public createAccount(
    @AuthUser() user: Users,
    @Body() accountDto: AccountDto
  ) {
    return this.accountJobBidService.syncProposal(user.id, user.companyId, { accountDto });
  }

  @ApiBearerAuth()
  @Post('/manual')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
  public async createmanualBid(
      @AuthUser() user: Users,
      @Body() bidDto: CreateManualBidDto
  ) {
      return this.accountJobBidService.createManualBid(user, bidDto);
  }

  @ApiBearerAuth()
  @Put("/client/update/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public async updateAccountData(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateClientDto: ClientDto
  ) {
    try {
      const result = await this.accountService.updateAccountData(id, updateClientDto);
      return result;
    } catch (error) {
      console.error(error)
      throw error;
    }
  }

  @ApiBearerAuth()
  @Get("/client/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public async getAccountById(
    @Param('id', new ParseUUIDPipe()) id: string
  ) {
    try {
      const account = await this.accountService.getAccountById(id);
      return account;
    } catch (error) {
      console.error("Error fetching account details:", error);
      throw error;
    }
  }

  @ApiBearerAuth()
  @Put("/update")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public updateAccount(
    @Body() accountDto: AccountDto,
    @AuthUser() user: Users
  ) {
    return this.accountJobBidService.syncLead({ accountDto }, user);
  }

  @ApiBearerAuth()
  @Put("/add-deal")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public addAccountDeal(
    @Body() accountDto: AccountDto,
    @AuthUser() user: Users
  ) {
    return this.accountJobBidService.syncContract({ accountDto, user});
  }

  @ApiBearerAuth()
  @Get("/location")
  // it will later change to just ROLES.BIDDER
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public getAccountState() {
    return this.accountService.getAccountState();
  }

  @ApiBearerAuth()
  @Get("/")
  // it will later change to just ROLES.BIDDER
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public getAllBiddersAccounts(
    @AuthUser() user: Users,
    @Query("search") search: string,
    @Query("profile") profile: ParseUUIDPipe,
    @Query("page", ParseIntPipe) page: number,
    @Query("bidder") bidder: string,
    @Query("perPage") perPage: string,
  ) {
    return this.accountJobBidService.getAllBiddersOrAdminAccounts(
      user,
      search,
      profile,
      bidder,
      page,
      perPage,
    );
  }

}
