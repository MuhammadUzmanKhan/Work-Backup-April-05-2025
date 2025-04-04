import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JobService } from "./jobs.service";
import { Public } from "src/common/decorators/public.meta";
import { JobDto } from "./dto/jobs.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { JobAccountService } from "./job-account-service";
import { JobBidService } from "./job-bid-service";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";

@Controller("")
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobAccountBidService: JobAccountService,
    private readonly jobBidService: JobBidService
  ) {}

  @Public()
  @Post()
  public createAccount(
    @AuthUser() user: Users,
    @Body() jobDto: JobDto
  ) {
    return this.jobService.createOrFindJob(user.companyId, jobDto);
  }

  @Public()
  @Get("/job/:id")
  public getJobById(
    @AuthUser() user: Users,
    @Param("id", new ParseUUIDPipe()
  ) id: string) {
    return this.jobService.getJobById(user.companyId, id);
  }

  @Public()
  @Delete("/job/:id")
  public deleteJobById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.jobService.deleteJobById(id);
  }

  @ApiBearerAuth()
  @Get("/jobs/categories")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.MANAGER))
  public getJobCategories() {
    return this.jobService.getJobCategories();
  }

  @ApiBearerAuth()
  @Get("/jobs/states")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.MANAGER))
  public getJobsByState() {
    return this.jobAccountBidService.getJobsByState();
  }

  @ApiBearerAuth()
  @Get("/jobs-ids")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.MANAGER))
  public getBiddersAccountIds(@AuthUser() user: Users) {
    return this.jobBidService.getBiddersAccountIds(user.id);
  }
}
