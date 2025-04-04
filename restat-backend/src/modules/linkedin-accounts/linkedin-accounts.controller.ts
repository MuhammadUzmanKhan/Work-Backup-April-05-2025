import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { LinkedinAccountInstitutionDegreeService } from "./linkedin-contact.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";
import { LinkedinAccountsDto } from "./dto/linkedin-accounts.dto";
import { DateProps } from "../bids/bids-jobs-accounts.service";
import * as moment from "moment";
import { LINKEDIN_CONNECTION_TYPE } from "src/common/constants/linkedin";

@Controller("linkedin-accounts")
export class LinkedinAccountController {
  constructor(private readonly linkedinAccountInstitutionDegreeService: LinkedinAccountInstitutionDegreeService) { }

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public createLinkedinAccount(@AuthUser() user: Users, @Body() linkedinAccountDto: LinkedinAccountsDto) {
    return this.linkedinAccountInstitutionDegreeService.syncConnectAndSyncProspect(user, { linkedinAccountDto });
  }

  @ApiBearerAuth()
  @Get("/dashboard/count")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public countLinkedinConnectsForDashboard(
    @AuthUser() user: Users,
    @Query("startDate") startDate: any,
    @Query("endDate") endDate: any,
    @Query("bidderId") bidderId?: string,
  ) {
    const dates: DateProps = {
      startDate: ['undefined', undefined, null].includes(startDate) ? moment('1970-01-01').toISOString() : moment(startDate).toISOString(),
      endDate: ['undefined', undefined, null].includes(endDate) ? moment().toISOString() : moment(endDate).toISOString()
    }
    return this.linkedinAccountInstitutionDegreeService.countLinkedinConnectsForDashboard(user, dates, bidderId);
  }

  @ApiBearerAuth()
  @Get('/all')
  @UseGuards(RoleGuard(ROLES.BIDDER, ROLES.COMPANY_ADMIN))
  public getLinkedinListing(
    @AuthUser() user: Users,
    @Query("search") search: string,
    @Query("profile") profile: string,
    @Query("page", ParseIntPipe) page: number,
    @Query("bidder") bidder: string,
    @Query("type") type: LINKEDIN_CONNECTION_TYPE,
    @Query("startDate") startDate: any,
    @Query("endDate") endDate: any,
    @Query("perPage") perPage: string,
    @Query("industries") industries: string,
    @Query("slug") slug: string,
  ) {
    const dates: DateProps = {
      startDate: ['undefined', undefined, null].includes(startDate) ? undefined : moment(startDate).toISOString(),
      endDate: ['undefined', undefined, null].includes(endDate) ? undefined : moment(endDate).toISOString()
    }
    return this.linkedinAccountInstitutionDegreeService.getLinkedinListing(user, search, profile?.split(','), page, bidder?.split(','), industries?.split(','), type, dates, perPage, slug);
  }

  @Get('/add-slug')
  public addSlug() {
    return this.linkedinAccountInstitutionDegreeService.generateSlugs();
  }

}
