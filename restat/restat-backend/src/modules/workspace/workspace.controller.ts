import {
  Body, Controller, Get,
  Param, ParseUUIDPipe,
  Post, UseGuards, Put,
  Delete,
  Query,
} from "@nestjs/common";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";
import { WorkspaceService } from "./workspace.service";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { RoleGuard } from "../../common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { ApiBearerAuth } from "@nestjs/swagger";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";


@Controller("workspaces")
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) { }

  @ApiBearerAuth()
  @Post()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public createCompany(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @AuthUser() user: Users
  ) {
    return this.workspaceService.createCompany(user.id, createWorkspaceDto);
  }

  @ApiBearerAuth()
  @Post('/workspace-deletion')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public deleteWorkspace(
    @AuthUser() user: Users,
    @Body() otp: { otp: string }
  ) {
    return this.workspaceService.deleteWorkspace({
      otp,
      user: user
    });
  }

  @ApiBearerAuth()
  @Post('/send-otp')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public sendOtp(
    @AuthUser() user: Users,
  ) {
    return this.workspaceService.requestWorkspaceDeletionOtp(user);
  }

  @ApiBearerAuth()
  @Get('/workspace-deletion')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public getWorkspaceDeletion(
    @AuthUser() user: Users,
  ) {
    return this.workspaceService.getWorkspaceDeletionDate(user);
  }

  @ApiBearerAuth()
  @Delete('/workspace-deletion')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public deleteWorkspaceDeletion(
    @AuthUser() user: Users
  ) {
    return this.workspaceService.deleteWorkspaceDeletion(user.companyId);
  }

  @ApiBearerAuth()
  @Get('/:id')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
  public getCompany(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.workspaceService.getCompanyById(id);
  }

  @ApiBearerAuth()
  @Put('/:id')
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public updateCompany(
    @Param('id') companyId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {

    return this.workspaceService.updateWorkspace(companyId, updateWorkspaceDto);
  }
  @ApiBearerAuth()
  @Get()
  @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
  public getAllCompanies(
    @Query('search') search: string,
    @Query('dateFilterType') dateFilterType: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 20,
  ) {
    return this.workspaceService.getAllWorkspaces({ search, page, perPage, startDate, endDate, dateFilterType });
  }

}
