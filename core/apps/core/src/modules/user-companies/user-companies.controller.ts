import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { UserCompaniesService } from './user-companies.service';
import {
  AddCommentDto,
  CreateUserCompanyDto,
  UpdateUserCompanyDto,
  UserCompaniesChangeLogsDto,
  UserCompaniesQueryDto,
} from './dto';

@ApiTags('User Companies')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('user-companies')
export class UserCompaniesController {
  constructor(private readonly userCompaniesService: UserCompaniesService) {}

  @ApiOperation({
    summary:
      'Create the Company and Role against a User and assign to given department',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_COMPANY_CREATE)
  @Post()
  createUserCompany(
    @Body() createUserCompanyDto: CreateUserCompanyDto,
    @AuthUser() user: User,
  ) {
    return this.userCompaniesService.createUserCompany(
      createUserCompanyDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Add a comment against User',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_COMPANY_ADD_COMMENT)
  @Post('/add-comment')
  addUserCompanyComment(
    @Body() addCommentDto: AddCommentDto,
    @AuthUser() user: User,
  ) {
    return this.userCompaniesService.addUserCompanyComment(addCommentDto, user);
  }

  @ApiOperation({
    summary: 'Get All User Companies with their Roles',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_COMPANY_VIEW_ALL)
  @Get('/')
  getAllUserCompanies(
    @Query() userCompaniesQuery: UserCompaniesQueryDto,
    @AuthUser() user: User,
  ) {
    return this.userCompaniesService.getAllUserCompanies(
      userCompaniesQuery,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get All Change Logs of User Companies',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_COMPANY_VIEW_CHANGE_LOGS)
  @Get('/change-logs')
  getUserCompanyChangeLogs(
    @Query() userCompaniesChangeLogsDto: UserCompaniesChangeLogsDto,
  ) {
    return this.userCompaniesService.getUserCompanyChangeLogs(
      userCompaniesChangeLogsDto,
    );
  }

  @ApiOperation({
    summary: 'Get all Comments',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_COMPANY_VIEW_COMMENTS)
  @Get('/comments')
  getUserCompanyComments(
    @Query() userCompaniesChangeLogsDto: UserCompaniesChangeLogsDto,
    @AuthUser() user: User,
  ) {
    return this.userCompaniesService.getUserCompanyComments(
      userCompaniesChangeLogsDto,
      user,
    );
  }

  @ApiOperation({ summary: 'Update the User Company' })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_COMPANY_UPDATE)
  @Put('/:id')
  updateUserCompany(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateUserCompanyDto: UpdateUserCompanyDto,
    @AuthUser() user: User,
  ) {
    return this.userCompaniesService.updateUserCompany(
      pathParamIdDto.id,
      updateUserCompanyDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Block or Unblock User from Company',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_COMPANY_BLOCK)
  @Put('/:id/block')
  @ApiBearerAuth()
  blockOrUnblockUserCompany(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.userCompaniesService.blockOrUnblockUserCompany(
      pathParamIdDto.id,
      user,
    );
  }

  @ApiOperation({ summary: 'Destroy the User Company' })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_COMPANY_DELETE)
  @Delete('/:id')
  deleteUserAttachment(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.userCompaniesService.deleteUserCompany(pathParamIdDto.id, user);
  }
}
