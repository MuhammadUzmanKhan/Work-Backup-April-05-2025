import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";
import { PortfolioDto } from "./dto/portfolio.dto";
import { PortfolioLinksTagsService } from "./portfolios-tags-links.service";
import { UpdatePortfolioDto } from "./dto/updatePortfolio.dto";
import { PORTFOLIO_TYPE } from "src/common/constants/portfolio_type";

@Controller("portfolios")
export class PortfoliosController {
  constructor(
    private readonly portfolioLinksTagsService: PortfolioLinksTagsService
  ) { }

  @ApiBearerAuth()
  @Post("/")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public createPortfolio(
    @AuthUser() user: Users,
    @Body() portfolioDto: PortfolioDto
  ) {
    return this.portfolioLinksTagsService.createPortfolio(
      user.companyId,
      portfolioDto
    );
  }

  @ApiBearerAuth()
  @Post("/bulk-import")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public uploadPorfoliosfrimExcel(
    @AuthUser() user: Users,
    @Body() BulkPortfoliosDto: PortfolioDto[]
  ) {
    return this.portfolioLinksTagsService.uploadPortfoliosFromExcel(user.companyId, BulkPortfoliosDto);
  }

  @ApiBearerAuth()
  @Put("/")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public updatePortfolio(
    @AuthUser() user: Users,
    @Body() portfolioDto: UpdatePortfolioDto
  ) {
    return this.portfolioLinksTagsService.updatePortfolio(user.companyId, portfolioDto);
  }

  @ApiBearerAuth()
  @Delete("/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public deletePortfolio(
    @Param("id", new ParseUUIDPipe()) id: string,
    @AuthUser() user: Users
  ) {
    return this.portfolioLinksTagsService.deletePortfolioById(
      id,
      user.companyId
    );
  }

  @ApiBearerAuth()
  @Get("/")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public getAllPorfolios(
    @AuthUser() user: Users,
    @Query("page", ParseIntPipe) page: number,
    @Query("search") searchQuery: string,
    @Query("type") type: PORTFOLIO_TYPE,
    @Query("perPage") perPage: string,
    @Query("sort") sort: string,
    @Query("tags") tags: string

  ) {
    return this.portfolioLinksTagsService.getAllPortfolios(
      user.companyId,
      page,
      searchQuery,
      type,
      perPage,
      sort,
      tags,
    );
  }

  @ApiBearerAuth()
  @Get("/matched")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public getMatchedPortfolios(
    @AuthUser() user: Users,
    @Query("matchedPortfoliosPage", ParseIntPipe) matchedPortfoliosPage: number,
    @Query("type") type: PORTFOLIO_TYPE,
    @Query("tags") tags: any
  ) {
    return this.portfolioLinksTagsService.getMatchedPortfolios(
      user.companyId,
      matchedPortfoliosPage,
      type,
      tags
    );
  }

  @ApiBearerAuth()
  @Get("/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  public getPortfolioById(
    @AuthUser() user: Users,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.portfolioLinksTagsService.getPortFolioById(id, user.companyId);
  }

}
