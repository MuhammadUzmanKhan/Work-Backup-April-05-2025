/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Put,
  Param,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { _UserAccess } from '@Common/constants';

import { StaffService } from './staff.service';
import {
  AttendanceAuditDto,
  CreateStaffDto,
  GetStaffByEventDto,
  UploadCsvDto,
  RemoveBulkStaffDto,
  UpdateAttendanceMobileDto,
  PositionCountDto,
  ReuploadStaffDto,
  UpdateAttendanceDto,
  DownloadReportDto,
  GetStaffDetailByQrcodeDto,
  StaffIdsDto,
} from './dto';
import {
  createStaff,
  updateAttendance,
  uploadCsv,
  removeBulkStaff,
  updateAttendanceMobile,
  reuploadCsv,
  staffIds,
} from './body';

@ApiTags('Staff')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @ApiOperation({
    summary: 'To create a single staff against a vendor or shift',
  })
  @ApiBody(createStaff)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_CREATE)
  @Post('/')
  createStaff(@Body() createStaffDto: CreateStaffDto, @AuthUser() user: User) {
    return this.staffService.createStaff(createStaffDto, user);
  }

  @ApiOperation({
    summary: 'To create bulk staff members with shifts against an event',
  })
  @ApiBody(uploadCsv)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_UPLOAD_CSV)
  @Post('/upload')
  uploadCsv(@Body() uploadCsvDto: UploadCsvDto, @AuthUser() user: User) {
    return this.staffService.uploadCsv(uploadCsvDto, user);
  }

  @ApiOperation({
    summary:
      'To re-upload bulk staff members with shifts against a single vendor',
  })
  @ApiBody(reuploadCsv)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_UPLOAD_CSV)
  @Post('/re-upload')
  reuploadCsv(
    @Body() reuploadStaffDto: ReuploadStaffDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.reuploadCsv(reuploadStaffDto, user);
  }

  @ApiOperation({
    summary: 'To Fetch a list of staff members against an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW)
  @Get('/')
  getAllStaffByEvent(
    @Query() getStaffByEventDto: GetStaffByEventDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.staffService.getAllStaffByEvent(
      getStaffByEventDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'To download pdf report',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_DOWNLOAD_REPORT)
  @Get('/report')
  downloadReport(
    @Query() downloadReportDto: DownloadReportDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.staffService.downloadReport(downloadReportDto, user, req, res);
  }

  @ApiOperation({
    summary:
      'To get list of urls with details for original uploaded csv against event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_DOWNLOAD_CSV)
  @Get('/original-csv')
  getAllOriginalCsvByEvent(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.getAllOriginalCsvByEvent(
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary:
      'To get list of all vendors with shift and staff counts against event',
  })
  @Get('/attendance-audit/vendor-stats')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_STATS)
  getVendorWithShiftsAndStaffCounts(
    @Query() attendanceAuditDto: AttendanceAuditDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.getVendorWithShiftsAndStaffCounts(
      attendanceAuditDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To get overall counts against event for all vendors',
  })
  @Get('/attendance-audit/stats')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_STATS)
  getVendorStats(
    @Query() attendanceAuditDto: AttendanceAuditDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.getVendorStats(attendanceAuditDto, user);
  }

  @ApiOperation({
    summary: 'To get total asset counts against event for all vendors',
  })
  @Get('/attendance-audit/assets')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_STATS)
  getTotalAssetsByVendor(
    @Query() attendanceAuditDto: AttendanceAuditDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.getTotalAssetsByVendor(attendanceAuditDto, user);
  }

  @ApiOperation({
    summary: 'To get counts for each positions against event Id',
  })
  @Get('/position-count')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_POSITIONS_COUNT)
  getAllPositionCount(
    @Query() positionCountDto: PositionCountDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.getAllPositionCount(positionCountDto, user);
  }

  @ApiOperation({
    summary: 'To check if any staff member exist against an event',
  })
  @Get('/staff-exist')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW)
  checkIfStaffExist(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.staffService.checkIfStaffExist(eventIdQueryDto.event_id);
  }

  @ApiOperation({
    summary: 'To get vendor, shift, position against a qrcode',
  })
  @Get('/detail')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_UPDATE_ATTENDANCE)
  getDetailByQrcode(
    @Query() getStaffDetailByQrcodeDto: GetStaffDetailByQrcodeDto,
  ) {
    return this.staffService.getDetailByQRcode(getStaffDetailByQrcodeDto);
  }

  @ApiOperation({
    summary:
      'To update checkin or checkout time of a staff member. First time it will add Check in, second time it will add Check out',
  })
  @ApiBody(updateAttendanceMobile)
  @Put('/mobile/attendance')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_UPDATE_ATTENDANCE)
  updateAttendanceMobile(
    @Body() updateAttendanceMobileDto: UpdateAttendanceMobileDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.updateAttendanceMobile(
      updateAttendanceMobileDto,
      user,
    );
  }

  @ApiOperation({ summary: 'To toggle the flagged value of a staff member' })
  @Put('/:id/flag')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_UPDATE_FLAG)
  updateFlag(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.staffService.updateFlag(pathParamIdDto.id, user);
  }

  @ApiOperation({ summary: 'To toggle the priority value of a staff member' })
  @Put('/:id/priority')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_UPDATE_PRIORITY)
  updatePriority(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.updatePriority(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary:
      'To update checkin or checkout time of a staff member. First time it will add Check in, second time it will add Check out',
  })
  @ApiBody(updateAttendance)
  @Put('/:id/attendance')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_UPDATE_ATTENDANCE)
  updateAttendance(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.updateAttendance(
      pathParamIdDto.id,
      updateAttendanceDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To delete staff members against vendor ids or shift ids',
  })
  @ApiBody(removeBulkStaff)
  @Delete()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_DELETE)
  deleteBulkStaff(
    @Body() removeBulkStaffDto: RemoveBulkStaffDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.deleteBulkStaff(removeBulkStaffDto, user);
  }

  @ApiOperation({
    summary: 'To delete multiple staff members by staff Ids',
  })
  @ApiBody(staffIds)
  @Delete('/multiple')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_DELETE)
  async deleteMultipleStaff(
    @Body() staffIdsDto: StaffIdsDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.deleteMultipleStaff(staffIdsDto, user);
  }

  @ApiOperation({
    summary: 'To delete staff members by staff Id',
  })
  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_DELETE)
  deleteStaff(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.staffService.deleteStaff(pathParamIdDto.id, user);
  }
}
