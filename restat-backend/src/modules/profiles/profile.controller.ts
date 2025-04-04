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
import { ProfileService } from "./profile.service";
// import { Public } from 'src/common/decorators/public.meta';
import { ProfileDto } from "./dto/profile.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";
import { SOURCE } from "src/common/constants/source";
import { UpdatePortfolioDto } from "../portfolios/dto/updatePortfolio.dto";

@Controller("profiles")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @ApiBearerAuth()
  @Post("/")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER))
  public createLinkedinProfile(
    @AuthUser() user: Users,
    @Body() profileDto: ProfileDto) {
    return this.profileService.createProfile(user.companyId, { profileDto });
  }

  @ApiBearerAuth()
  @Put("/")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER))
  public updateProfile(
    @Body() profileDto: UpdatePortfolioDto) {
    return this.profileService.updateProfile({ profileDto });
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public getAllCompanyProfiles(
    @AuthUser() user: Users,
    @Query("source") source: SOURCE
  ) {
    return this.profileService.getAllCompanyProfiles(user.companyId, source);
  }

  @ApiBearerAuth()
  @Get("/company")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public getCompanyProfiles(
    @AuthUser() user: Users,
    @Query("page", ParseIntPipe) page: number,
    @Query("perPage", ParseIntPipe) perPage: number = 20,
  ) {
    return this.profileService.getCompanyProfiles(user.companyId, page, perPage);
  }

  @ApiBearerAuth()
  @Get("/all")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public getAllProfiles(@Query("source") source: SOURCE) {
    return this.profileService.getAllProfiles(source);
  }

  @ApiBearerAuth()
  @Delete("/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
  public async deleteUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.profileService.deleteProfile(id);
  }
}
