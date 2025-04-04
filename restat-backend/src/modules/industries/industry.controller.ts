import { Body, Controller, Get, Post, UseGuards, Put, Query, ParseIntPipe, Param, Delete } from "@nestjs/common";
import { IndustryService } from "./industry.service";
// import { Public } from 'src/common/decorators/public.meta';
import { IndustryDto } from "./dto/industry.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { Users } from "src/common/models/users.model";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";

@Controller("industries")
export class IndustryController {
  constructor(private readonly industryService: IndustryService) { }

  @ApiBearerAuth()
  @Post("/")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
  public createLinkedinProfile(
    @AuthUser() user: Users,
    @Body() industryDto: IndustryDto) {
    return this.industryService.createIndustry(user.companyId, { industryDto });
  }

  @ApiBearerAuth()
  @Get("/")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public getLinkedinProfiles(
    @AuthUser() user: Users,
  ) {
    return this.industryService.getIndustries(user.companyId);
  }

  @ApiBearerAuth()
  @Get("/all")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public getLinkedinProfilesWithPagination(
    @AuthUser() user: Users,
    @Query("search") search: string,
    @Query("page", ParseIntPipe) page: number = 1,
    @Query("perPage", ParseIntPipe) perPage: number = 20,
  ) {
    return this.industryService.getIndustriesWithPagination({ user, page, perPage, search });
  }

  @ApiBearerAuth()
  @Put("/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public async editIndustry(
    @Body() industryDto: IndustryDto,
    @Param('id') id: string
  ) {
    return this.industryService.updateIndustry({ industryId: id, industryDto });
  }

  @ApiBearerAuth()
  @Delete("/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
  public async deleteIndustry(
    @Param('id') id: string
  ) {
    return this.industryService.deleteIndustry(id);
  }

}
