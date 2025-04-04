import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { User } from '@ontrack-tech-group/common/models';
import { UserAccess } from '@Common/constants';
import { ShiftService } from './shift.service';
import { GetAllShifts } from './dto';

@ApiTags('Shift')
@ApiBearerAuth()
@Controller('shift')
@ApiHeader(COMPANY_ID_API_HEADER)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @ApiOperation({
    summary: 'To get all shift of an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SHIFT_VIEW_ALL)
  @Get('/')
  getAllShifts(@Query() getAllShifts: GetAllShifts, @AuthUser() user: User) {
    return this.shiftService.getAllShifts(getAllShifts, user);
  }

  @ApiOperation({ summary: 'To fetch all shift dates against an event' })
  @Get('/dates')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SHIFT_VIEW_ALL)
  getAllShiftDates(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.shiftService.getAllShiftDates(eventIdQueryDto.event_id, user);
  }

  @ApiOperation({
    summary:
      'To get all rate list of all the shifts against a vendor and event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SHIFT_VIEW_ALL)
  @Get('/rates')
  getAllShiftsRates(
    @Query() getAllShifts: GetAllShifts,
    @AuthUser() user: User,
  ) {
    return this.shiftService.getAllShiftsRates(getAllShifts, user);
  }
}
