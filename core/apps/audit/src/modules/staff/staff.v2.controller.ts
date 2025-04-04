import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { _UserAccess } from '@Common/constants';
import { GetPositionDataQueryParamsDto } from '@Modules/vendor-position/dto/get-position-table-data';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';

import { StaffV2Service } from './staff.v2.service';
import { GetStats, GetStatsSummary } from './helper';
import {
  BulkStaffUpdateDto,
  AddRemoveStaffDto,
  StaffStatsDto,
  StaffStatsSummaryDto,
} from './dto';
import { addRemoveStaff } from './body';

@ApiTags('Staff')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('/v2/staff')
export class StaffV2Controller {
  constructor(private readonly staffService: StaffV2Service) {}

  @ApiOperation({
    summary:
      'To add or delete bulk staff members against vendor, shift & position id',
  })
  @ApiBody(addRemoveStaff)
  @Post()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_DELETE)
  addDeleteStaff(
    @Body() addRemoveStaffDto: AddRemoveStaffDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.addDeleteStaff(addRemoveStaffDto, user);
  }

  @ApiOperation({
    summary: 'To get overall counts against event for all vendors',
  })
  @Get('/stats')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_STATS)
  getVendorStats(
    @Query() staffStatsDto: StaffStatsDto,
    @AuthUser() user: User,
  ): Promise<GetStats> {
    return this.staffService.getVendorStats(staffStatsDto, user);
  }

  @ApiOperation({
    summary: 'To get overall counts against event for all vendors',
  })
  @Get('/stats/summary')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_STATS)
  getStatsSummary(
    @Query() staffStatsSummaryDto: StaffStatsSummaryDto,
    @AuthUser() user: User,
  ): Promise<GetStatsSummary> {
    return this.staffService.getStatsSummary(staffStatsSummaryDto, user);
  }

  @ApiOperation({
    summary: 'To get date wise counts',
  })
  @Get('/stats/total-staff')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_STATS)
  getTotalStaffStats(
    @Query() totalStaffDto: StaffStatsSummaryDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.getTotalStaffStats(totalStaffDto, user);
  }

  @ApiOperation({
    summary: 'To get date wise common vendors',
  })
  @Get('/stats/common-vendors')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_STATS)
  getCommonVendors(
    @Query() commonVendorsDto: GetPositionDataQueryParamsDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.getCommonVendors(commonVendorsDto, user);
  }

  @ApiOperation({
    summary: 'Get Order Vs Delivered By Dates',
  })
  @Get('/order-by-date')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.STAFF_VIEW_STATS)
  orderAndDeliveredByDate(
    @Query() staffStatsSummaryDto: StaffStatsSummaryDto,
    @AuthUser() user: User,
  ) {
    return this.staffService.orderAndDeliveredByDate(
      staffStatsSummaryDto,
      user,
    );
  }

  @ApiOperation({ summary: 'To fetch notes against staff ID' })
  @Get('/:id/notes')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.NOTE_VIEW)
  getNotesByStaffId(@Param() pathParamIdDto: PathParamIdDto) {
    return this.staffService.getNotesByStaffId(pathParamIdDto.id);
  }

  @ApiOperation({
    summary: 'update batch data for flag, priority',
  })
  @Put('/batch')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    _UserAccess.STAFF_UPDATE_FLAG,
    _UserAccess.STAFF_UPDATE_PRIORITY,
  )
  updateBatchData(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @Body() bulkStaffUpdateDto: BulkStaffUpdateDto,
  ): Promise<{ message: string }> {
    return this.staffService.updateBatchData(
      eventIdQueryDto,
      bulkStaffUpdateDto,
    );
  }
}
