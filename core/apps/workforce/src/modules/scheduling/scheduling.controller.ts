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
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { SchedulingService } from './scheduling.service';
import {
  AssignShiftToStaffScheduleDto,
  GetStaffScheduleDto,
  UpdateShiftScheduleDto,
} from './dto';

@ApiTags('Scheduling')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCHEDULING_ASSIGN_SHIFT)
  @Post('/assign-shift')
  assignShiftToStaff(
    @Query() assignShiftToStaff: AssignShiftToStaffScheduleDto,
  ) {
    return this.schedulingService.assignShiftToStaff(assignShiftToStaff);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCHEDULING_VIEW_STAFF_SHIFTS)
  @Get('/staff-shift-listing')
  staffShiftListing(@Query() getStaffSchedule: GetStaffScheduleDto) {
    return this.schedulingService.staffShiftListing(getStaffSchedule);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCHEDULING_EVENT_UNSCHEDULE_STAFF)
  @Get('/event-unscheduled-staff')
  getUnscheduledStaff(@Query() getStaffSchedule: GetStaffScheduleDto) {
    return this.schedulingService.getUnscheduledStaff(getStaffSchedule);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCHEDULING_UPDATE)
  @Put('/:id')
  updateShift(
    @Param('id') pathParam: PathParamIdDto,
    @Body() updateStaffSchedule: UpdateShiftScheduleDto,
  ) {
    return this.schedulingService.updateShift(
      pathParam.id,
      updateStaffSchedule,
    );
  }
}
