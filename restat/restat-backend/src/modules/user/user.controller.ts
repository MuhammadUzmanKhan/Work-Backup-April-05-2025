import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
// import { Public } from "src/common/decorators/public.meta";
import { UserService } from "./user.service";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";
import { UpdateNameDto } from "./dto/update-name.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AddUserProfileDto } from "./dto/add-user-profile.dto";
import { UpdateUserCompanyDto } from "./dto/update-user-compnay.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { SOURCE } from "src/common/constants/source";

@Controller("user")
export class UserController {
  constructor(
    private readonly usersService: UserService,
  ) { }

  @ApiBearerAuth()
  @Get()
  public async getAllUsers(
  ) {
    return this.usersService.getAllUsers();
  }

  @ApiBearerAuth()
  @Get("/company-users")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async getCompanyUsers(
    @AuthUser() user: Users,
    @Query("page", ParseIntPipe) page: number,
    @Query("perPage", ParseIntPipe) perPage: number = 20,
  ) {
    return this.usersService.getCompanyUsers(user.companyId, page, perPage);
  }

  @ApiBearerAuth()
  @Get("/count/company-users")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async countAllCompanyUsers(
    @AuthUser() user: Users,
  ) {
    return this.usersService.countAllCompanyUsers(user.companyId);
  }

  @ApiBearerAuth()
  @Get("/company-invites")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async getCompanyPendingInvites(
    @AuthUser() user: Users,
    @Query("page", ParseIntPipe) page: number,
  ) {
    return this.usersService.getPendingInvites(user.companyId, page);
  }

  @ApiBearerAuth()
  @Get("/all/company-users")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
  public async getAllCompanyUsers(
    @AuthUser() user: Users,
  ) {
    return this.usersService.getAllCompanyUsers(user.companyId);
  }

  @ApiBearerAuth()
  @Post("/add-user-profile")
  public async userProfile(
    @Body() addUserProfileDto: AddUserProfileDto,
    @AuthUser() user: Users
  ) {
    return this.usersService.addUserProile(user.id, addUserProfileDto);
  }

  @ApiBearerAuth()
  @Post("/update-name")
  public async updateName(
    @Body() updateNameDto: UpdateNameDto,
    @AuthUser() user: Users
  ) {
    return this.usersService.updateName(user.id, updateNameDto);
  }

  @ApiBearerAuth()
  @Post("/update-status/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async updateStatus(
    @Body() updateStatusDto: UpdateStatusDto,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }

  @ApiBearerAuth()
  @Post("/update-company")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async updateUserCompnay(
    @Body() updateUserCompnayDto: UpdateUserCompanyDto,
  ) {
    return this.usersService.updateUserCompany(updateUserCompnayDto);
  }

  @ApiBearerAuth()
  @Post("/update-role")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async updateUserRole(
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(updateUserRoleDto);
  }

  @ApiBearerAuth()
  @Put("/update")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async updateUser(
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(updateUserDto);
  }

  @ApiBearerAuth()
  @Delete("/delete/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async deleteUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.usersService.deleteUser(id);
  }

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public async createUser(
    @AuthUser() user: Users,
    @Body() createUserDto: CreateUserDto
  ) {
    return this.usersService.createUser(user.companyId, createUserDto);
  }

  @ApiBearerAuth()
  @Get("/goal/count")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
  public countLinkedinConnects(
    @AuthUser() user: Users,
    @Query("monthStart") monthStart: string,
    @Query("dayStart") dayStart: string,
    @Query("dayEnd") dayEnd: string,
    @Query("type") type: SOURCE = SOURCE.UPWORK,
  ) {
    return this.usersService.getGoalCount({ userId: user.id, type, monthStart, dayStart, dayEnd });
  }
}
