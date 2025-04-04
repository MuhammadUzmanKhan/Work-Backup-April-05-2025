// src/controllers/mongo-export.controller.ts
import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { MongoExportBiddersService } from './mongo-export-bidders.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ROLES } from 'src/common/constants/roles';
import { MongoExportCompaniesService } from './mongo-export-companies.service';
import { MongoExportIndustriesService } from './mongo-export-industries.service';
import { MongoExportProfilesService } from './mongo-export-profiles.service';
import { MongoExportTagsService } from './mongo-export-tags.service';
// import { MongoExportProjectsService } from './mongo-export-projects.service';
// import { MongoExportCodeSnippetsService } from './mongo-export-code-snippets.service';
// import { MongoExportGithubLinksService } from './mongo-export-github-links.service';
// import { MongoExportClickupTemplatesService } from './mongo-export-clickup-templates.service';
import { MongoExportLinkedinAccountsDataService } from './mongo-export-linkedin-accounts-service';
import { MongoExportBidsService } from './mongo-export-bids.service';
import { AuthenticateUserDto } from '../auth/dto/authenticate.dto';
import { Public } from 'src/common/decorators/public.meta';

@Controller('mongo-export')
export class MongoExportController {
  constructor(private readonly mongoExportBiddersService: MongoExportBiddersService,
    private readonly mongExportCompaniesService: MongoExportCompaniesService,
    private readonly mongExportIndustriesService: MongoExportIndustriesService,
    private readonly mongExportProfilesService: MongoExportProfilesService,
    private readonly mongoExportTagsService: MongoExportTagsService,
    // private readonly mongoExportProjectsService: MongoExportProjectsService,
    // private readonly mongoExportCodeSnippetsService: MongoExportCodeSnippetsService,
    // private readonly mongoExportGithubLinksService: MongoExportGithubLinksService,
    // private readonly mongoExportClickupTemplatesService: MongoExportClickupTemplatesService,
    private readonly mongoExportLinkedinAccountsService: MongoExportLinkedinAccountsDataService,
    private readonly mongoExportBidsService: MongoExportBidsService
    ) {}

  @ApiBearerAuth()
  @Get('/bidders')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public exportBiddersData() {
    return this.mongoExportBiddersService.exportBiddersData();
  }

  @ApiBearerAuth()
  @Get('/companies')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public exportCompaniesData() {
    return this.mongExportCompaniesService.exportCompaniesData();
  }

  @ApiBearerAuth()
  @Get('/industries')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public exportIndustriesData() {
    return this.mongExportIndustriesService.exportIndustriesData();
  }

  @ApiBearerAuth()
  @Get('/profiles')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public exportProfilesData() {
    return this.mongExportProfilesService.exportProfilesData();
  }

  @ApiBearerAuth()
  @Get('/tags')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public exportTagsData() {
    return this.mongoExportTagsService.exportTagsData();
  }

  // @ApiBearerAuth()
  // @Get('/projects')
  // @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  // public exportProjectsData() {
  //   return this.mongoExportProjectsService.exportProjectsData();
  // }

  // @ApiBearerAuth()
  // @Get('/code-snippets')
  // @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  // public exportCodeSnippetsData() {
  //   return this.mongoExportCodeSnippetsService.exportCodeSnippetsData();
  // }

  // @ApiBearerAuth()
  // @Get('/github-links')
  // @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  // public exportGithubLinksData() {
  //   return this.mongoExportGithubLinksService.exportGithubLinksData();
  // }

  // @ApiBearerAuth()
  // @Get('/clickup-templates')
  // @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  // public exportTemplatesData() {
  //   return this.mongoExportClickupTemplatesService.exportTemplatesData();
  // }

  @ApiBearerAuth()
  @Get('/linkedin-accounts-data')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public exportLinkedinAccountsData(@Query("page", ParseIntPipe) page: number) {
    return this.mongoExportLinkedinAccountsService.exportLinkedinAccountsData(page);
  }

  @ApiBearerAuth()
  @Get('/bids')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public exportBidsData(@Query("page", ParseIntPipe) page: number) {
    return this.mongoExportBidsService.exportBidsData(page);
  }

  @Public()
  @Post("/authenticate-bidder")
  public signup(@Body() data: AuthenticateUserDto) {
    return this.mongoExportBiddersService.authenticateExportedBidder(data);
  }
}
