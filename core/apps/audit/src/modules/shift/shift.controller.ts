import {
  Controller,
  Get,
  // Post,
  // Body,
  Param,
  Query,
  // Put,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  // ApiBody,
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
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { _UserAccess } from '@Common/constants';

import { ShiftService } from './shift.service';
import {
  GetAllShiftRates,
  // CreateShiftDto,
  // UpdateShiftDto,
  GetAllShiftsDto,
  GetShiftByIdDto,
} from './dto';
import {} from // createShift,
// updateShift,
'./body';

@ApiTags('Shift')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  // @ApiOperation({ summary: 'To create a shift against an event' })
  // @Post()
  // @ApiBody(createShift)
  // @UseGuards(RolePermissionGuard)
  // @RolePermissions(_UserAccess.SHIFT_CREATE)
  // createShift(@Body() createShiftDto: CreateShiftDto, @AuthUser() user: User) {
  //   return this.shiftService.createShift(createShiftDto, user);
  // }

  @ApiOperation({ summary: 'To fetch all shifts against an event' })
  @Get()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.SHIFT_VIEW)
  getAllShifts(
    @Query() getAllShiftsDto: GetAllShiftsDto,
    @AuthUser() user: User,
  ) {
    return this.shiftService.getAllShifts(getAllShiftsDto, user);
  }

  @ApiOperation({
    summary: 'To fetch all shifts against an event for current day',
  })
  @Get('/current-day-shifts')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.SHIFT_VIEW)
  getShiftsOfCurrentDay(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.shiftService.getShiftsOfCurrentDay(
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({ summary: 'To fetch all shift dates against an event' })
  @Get('/dates')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.SHIFT_VIEW)
  getAllShiftDates(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.shiftService.getAllShiftDates(eventIdQueryDto.event_id, user);
  }

  @ApiOperation({
    summary:
      'To get all rate list of all the shifts against a vendor and event in Audit',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.SHIFT_VIEW)
  @Get('/rates')
  getAllAuditShiftsRates(
    @Query() getAllShifts: GetAllShiftRates,
    @AuthUser() user: User,
  ) {
    return this.shiftService.getAllShiftsRates(getAllShifts, user);
  }

  @ApiOperation({ summary: 'To fetch a shift against by its Id' })
  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.SHIFT_VIEW)
  getShiftById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() getShiftByIdDto: GetShiftByIdDto,
    @AuthUser() user: User,
  ) {
    return this.shiftService.getShiftById(
      pathParamIdDto.id,
      user,
      getShiftByIdDto,
    );
  }

  // @ApiOperation({ summary: 'To Update a shift against an event by shift Id' })
  // @Put(':id')
  // @ApiBody(updateShift)
  // @UseGuards(RolePermissionGuard)
  // @RolePermissions(_UserAccess.SHIFT_UPDATE)
  // updateShift(
  //   @Param() pathParamIdDto: PathParamIdDto,
  //   @Body() updateShiftDto: UpdateShiftDto,
  //   @AuthUser() user: User,
  // ) {
  //   return this.shiftService.updateShift(
  //     pathParamIdDto.id,
  //     updateShiftDto,
  //     user,
  //   );
  // }

  @ApiOperation({
    summary: 'To delete shift by Id',
  })
  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.SHIFT_DELETE)
  deleteStaff(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.shiftService.deleteShift(pathParamIdDto.id, user);
  }
}
