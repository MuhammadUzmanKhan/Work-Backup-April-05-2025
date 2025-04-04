import { Response, Request } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  Public,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  CompanyIdOptionalDto,
  EventIdQueryDto,
  EventIdQueryOptionalDto,
  PaginationDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
  X_API_KEY,
  X_API_SECRET,
} from '@ontrack-tech-group/common/constants';
import {
  RolePermissionGuard,
  WebhookPermission,
} from '@ontrack-tech-group/common/services';
import { UserService } from './user.service';
import {
  EventUsersQueryParamsDto,
  CreateUserDto,
  UpdateUserDto,
  AssignDepartmentDivisionUserDto,
  StaffDetailQueryParamsDto,
  UploadStaffToDeparmentsDto,
  UploadStaffDto,
  AllUsersQueryParamsDto,
  UploadUserAttachmentDto,
  UsersLocationDto,
  CreateUserLocationDto,
  GetDepartmentsUsers,
  AssignUnassignEventDto,
  UpdateUserStatusDto,
  SelectedUsersCsvDto,
  UserEventsChangeLogsDto,
  UserStatusWebhookDto,
  AssignDepartmentWithEventDto,
  UpdateUserSettingsDto,
  EventUserDto,
  UpdateBulkUserStatusDto,
  EventUserMentionDto,
  DispatchStaffUsersDto,
  IncidentStaffDto,
} from './dto';
import {
  createUserLocation,
  updateUser,
  getDepartmentsUsers,
  createUser,
  assignUnassignEventBody,
  assignDepartmentWithEvent,
  updateUserSetting,
  updateUserStatus,
} from './body';

@ApiTags('Users')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @ApiOperation({
    summary:
      'To send socket to front end from rails side when user status update',
  })
  @Public()
  @ApiHeader(X_API_KEY)
  @ApiHeader(X_API_SECRET)
  @Post('status-update-webhook')
  @UseGuards(WebhookPermission)
  userStatusUpdateWebhook(@Body() userStatusWebhookDto: UserStatusWebhookDto) {
    return this.usersService.userStatusUpdateWebhook(userStatusWebhookDto);
  }

  @ApiOperation({
    summary:
      'Create the staff against a event and assign to given department and divisions',
  })
  @ApiBody(createUser)
  @Post()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_CREATE, UserAccess.USER_ADD_NEW_STAFF)
  createUser(@Body() createUserDto: CreateUserDto, @AuthUser() user: User) {
    return this.usersService.createUser(createUserDto, user);
  }

  @ApiOperation({ summary: 'Upload the staff against multiple deparments' })
  @Post('/upload-users-to-departments')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_UPLOAD_STAFF)
  async uploadStaffToDepartments(
    @Body() uploadStaffDto: UploadStaffToDeparmentsDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ) {
    return this.usersService.uploadStaffToDepartments(
      uploadStaffDto,
      user,
      req,
    );
  }

  @ApiOperation({
    summary:
      'Upload the staff against a single deparment or division or upload drivers',
  })
  @Post('/upload-users')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_UPLOAD_STAFF)
  async uploadStaff(
    @Body() uploadStaffDto: UploadStaffDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.uploadStaff(uploadStaffDto, user);
  }

  @ApiOperation({
    summary: 'Upload attachment for users',
  })
  @Post('/upload-attachment')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_UPLOAD_ATTACHMENT)
  uploadUserAttachment(
    @Body() uploadUserAttachmentDto: UploadUserAttachmentDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.uploadUserAttachment(
      uploadUserAttachmentDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Create user location',
  })
  @ApiBody(createUserLocation)
  @Post('/location')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_CREATE_LOCATION)
  createUserLocation(
    @Body() createUserLocationDto: CreateUserLocationDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.createUserLocation(createUserLocationDto, user);
  }

  @ApiOperation({
    summary: 'Get the User list against the departments',
  })
  @ApiBody(getDepartmentsUsers)
  @Post('/mobile/departments-users')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_DEPARTMENTS_USERS)
  getUsersOfDepartments(
    @Body() getDepartmentsUsers: GetDepartmentsUsers,
    @AuthUser() user: User,
  ) {
    return this.usersService.getUsersOfDepartments(getDepartmentsUsers, user);
  }

  @ApiOperation({
    summary: 'Assign user with department to an event',
  })
  @ApiBody(assignDepartmentWithEvent)
  @Post('/assign-department-event')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_ASSIGN_UNLINKED_DEPARTMENT)
  assignDepartmentWithEvent(
    @Body() assignUserWithDepartment: AssignDepartmentWithEventDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.assignDepartmentWithEvent(
      assignUserWithDepartment,
      user,
    );
  }

  @ApiOperation({ summary: 'Get Attachment of a user' })
  @Get('/:id/attachments')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_ATTACHMENT)
  getUserAttachments(@Param() pathParamIdDto: PathParamIdDto) {
    return this.usersService.getUserAttachments(pathParamIdDto.id);
  }

  @ApiOperation({
    summary: 'Get the staff list against the department, division and event',
  })
  @Get()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.USER_VIEW_EVENT_USERS,
    UserAccess.USER_WORKFORCE_LIST_VIEW,
    UserAccess.USER_VIEW_EVENT_DIVISION_USERS,
    UserAccess.USER_EXPORT_CSV_PDF,
  )
  getEventUsersList(
    @Query() usersQuery: EventUsersQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.usersService.getEventUsersList(usersQuery, user, req, res);
  }

  @ApiOperation({
    summary: 'Get the staff list against the department, division and event',
  })
  @Get('v1')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.USER_VIEW_EVENT_USERS,
    UserAccess.USER_WORKFORCE_LIST_VIEW,
    UserAccess.USER_VIEW_EVENT_DIVISION_USERS,
    UserAccess.USER_EXPORT_CSV_PDF,
  )
  getEventUsersListV1(
    @Query() usersQuery: EventUsersQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.usersService.getEventUsersListV1(usersQuery, user, req, res);
  }

  @ApiOperation({
    summary:
      'Get the staff list against the department, and event for workforce user-listing',
  })
  @Get('workforce-department')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_EVENT_DEPARTMENTS_USERS)
  getEventUsersListForWorkforceDepartment(
    @Query() usersQuery: EventUsersQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.usersService.getEventUsersList(
      usersQuery,
      user,
      req,
      res,
      true,
    );
  }

  @Get('/all')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_ALL)
  getAllUsers(
    @Query() usersQuery: AllUsersQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.usersService.getAllUsers(usersQuery, user, req, res);
  }

  @ApiOperation({
    summary: 'Get all Users List who are linked with given event_id',
  })
  @Get('/event-users')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_EVENT_USERS)
  getAllEventUsers(
    @Query() eventUserDto: EventUserDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.getAllEventUsers(eventUserDto, user);
  }

  @ApiOperation({
    summary: 'Get all Users List for mention in event plan',
  })
  @Get('/event-plan/mention')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_EVENT_USERS)
  getAllUsersForMentionInEventPlan(
    @Query() eventUserMentionDto: EventUserMentionDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.getAllUsersForMentionInEventPlan(
      eventUserMentionDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get all Users List who are linked with given event_id',
  })
  @Get('/filtered-users')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.USER_ADD_EXISTING_STAFF_LISTING,
    UserAccess.USER_ASSIGN_DEPARTMENT,
    UserAccess.USER_ASSIGN_DIVISION,
  )
  getFilteredUsers(
    @Query() usersQuery: EventUsersQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.usersService.getFilteredUsers(usersQuery, user, req, res);
  }

  @ApiOperation({
    summary: 'Fetch users location',
  })
  @Get('/location')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_LOCATION)
  getUsersLocation(
    @Query() usersLocationDto: UsersLocationDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.getUsersLocation(usersLocationDto, user);
  }

  @ApiOperation({
    summary: 'Fetch user event assign/unassign changelog',
  })
  @Get('/user-event/change-log')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_EVENT_CHANGE_LOG)
  getUserEventChangelog(
    @Query() userEventsChangeLogsDto: UserEventsChangeLogsDto,
  ) {
    return this.usersService.getUserEventChangelog(userEventsChangeLogsDto);
  }

  @ApiOperation({
    summary: 'Get selected Users csv link',
  })
  @Get('/selected-users-csv-pdf')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_EVENT_USERS)
  getSelectedUserCsvPdf(
    @Query() selectedUsersCsvDto: SelectedUsersCsvDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.usersService.getSelectedUserCsvPdf(
      selectedUsersCsvDto,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Get the staff list that has not been assigned to any divison',
  })
  @Get('/division-unassigned-users')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_EVENT_USERS)
  getUnassignedDivisionUsersList(
    @Query() usersQuery: EventUsersQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.usersService.getUnassignedDivisionUsersList(
      usersQuery,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary:
      'Get incident divisions of a current logged in user against an event',
  })
  @Get('/incident-divisions')
  getIncidentDivisions(
    @Query() eventIdQueryDto: EventIdQueryOptionalDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.getIncidentDivisions(
      user.id,
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary:
      'Get the staff list against the department,and event for dispatching in incident dispatch center dropdown',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.USER_VIEW_EVENT_USERS,
    UserAccess.USER_WORKFORCE_LIST_VIEW,
    UserAccess.USER_VIEW_EVENT_DIVISION_USERS,
    UserAccess.USER_EXPORT_CSV_PDF,
  )
  @Get('/staff-dispatch')
  getStaffForDispatch(
    @Query() dispatchUsersQuery: DispatchStaffUsersDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.getStaffForDispatch(dispatchUsersQuery, user);
  }
  @ApiOperation({
    summary: 'Get the staff for incident dipatch center',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.USER_VIEW_EVENT_USERS,
    UserAccess.USER_WORKFORCE_LIST_VIEW,
    UserAccess.USER_VIEW_EVENT_DIVISION_USERS,
  )
  @Get('/incident-staff')
  getIncidentStaff(
    @Query() incidentStaffFilters: IncidentStaffDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.usersService.getIncidentStaff(incidentStaffFilters, user, res);
  }

  @ApiOperation({
    summary: 'Fetch User changelog',
  })
  @Get('/:id/change-logs')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_CHANGE_LOGS)
  getUserChangelogs(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.usersService.getUserChangelogs(
      pathParamIdDto.id,
      paginationDto,
    );
  }

  @ApiOperation({ summary: 'Get the staff incidents, task and division data' })
  @Get('/:id/map-services')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.USER_VIEW_EVENT_USERS,
    UserAccess.USER_WORKFORCE_LIST_VIEW,
    UserAccess.USER_VIEW_EVENT_DIVISION_USERS,
  )
  getUserMapServices(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() query: StaffDetailQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.usersService.getUserMapServices(
      pathParamIdDto.id,
      query,
      user,
      res,
      req,
    );
  }

  @ApiOperation({
    summary: 'Get all Events List of user',
  })
  @Get('/:id/events')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW_ALL)
  getAllUserEvents(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() companyIdDto: CompanyIdOptionalDto,
  ) {
    return this.usersService.getAllUserEvents(
      pathParamIdDto.id,
      companyIdDto.company_id,
    );
  }

  @ApiOperation({ summary: 'Get the staff detail by id' })
  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW, UserAccess.INCIDENT_VIEW_STAFF)
  getUserById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() query: StaffDetailQueryParamsDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.getUserById(pathParamIdDto.id, query, user);
  }

  @Get('/mobile/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW)
  getUserByIdMobile(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.getUserByIdMobile(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Block User Form Any Activity',
  })
  @Put('/block-user/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_BLOCK)
  blockUser(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.usersService.blockUser(pathParamIdDto.id, user);
  }

  @ApiOperation({ summary: 'Add Existing Staff to department' })
  @Put('/assign-department')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_ASSIGN_DEPARTMENT)
  assignDepartment(
    @Body() assignDepartmentDto: AssignDepartmentDivisionUserDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.assignDepartment(assignDepartmentDto, user);
  }

  @ApiOperation({ summary: 'Add Existing Staff to division' })
  @Put('/assign-division')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_ASSIGN_DIVISION)
  assignDivision(
    @Body() assignDivisionDto: AssignDepartmentDivisionUserDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.assignDivision(assignDivisionDto, user);
  }

  @ApiOperation({ summary: 'Assign a user to event' })
  @ApiBody(assignUnassignEventBody)
  @Put('/assign-event')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_ASSIGN_EVENT)
  assignEvent(
    @Body() assignUnassignEventDto: AssignUnassignEventDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.assignEvent(assignUnassignEventDto, user);
  }

  @ApiOperation({ summary: 'Unassign a user from an event' })
  @ApiBody(assignUnassignEventBody)
  @Put('/unassign-event')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_UNASSIGN_EVENT)
  unassignEvent(
    @Body() assignUnassignEventDto: AssignUnassignEventDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.unassignEvent(assignUnassignEventDto, user);
  }

  @ApiOperation({ summary: 'Update status of bulk users' })
  @Put('/update-status')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_UPDATE, UserAccess.USER_UPDATE_STATUS)
  updateBulkStatus(
    @Body() updateBulkUserStatusDto: UpdateBulkUserStatusDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.updateBulkStatus(updateBulkUserStatusDto, user);
  }

  @ApiOperation({ summary: 'Update settings of user' })
  @ApiBody(updateUserSetting)
  @Put('/settings')
  updateSettings(
    @Body() updateUserSettingsDto: UpdateUserSettingsDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.updateSettings(updateUserSettingsDto, user);
  }

  @ApiOperation({ summary: 'Update status of user' })
  @ApiBody(updateUserStatus)
  @Put('/:id/status')
  updateUserStatus(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @AuthUser() user: User,
  ) {
    return this.usersService.updateUserStatus(
      pathParamIdDto.id,
      updateUserStatusDto,
      user,
    );
  }

  @ApiOperation({ summary: 'Update the staff detail' })
  @ApiBody(updateUser)
  @Put('/:id')
  updateUser(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateUserDto: UpdateUserDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ) {
    return this.usersService.updateUser(
      updateUserDto,
      pathParamIdDto.id,
      user,
      req,
    );
  }

  @Delete('/:id/attachment/:attachmentId')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_DELETE_ATTACHMENT)
  deleteUserAttachment(
    @Param('id') id: number,
    @Param('attachmentId') attachmentId: number,
  ) {
    return this.usersService.deleteUserAttachment(+id, +attachmentId);
  }
}
