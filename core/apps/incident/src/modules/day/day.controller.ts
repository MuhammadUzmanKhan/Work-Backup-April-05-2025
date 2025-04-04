import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { DayService } from './day.service';
import { DayQueryParamsDto } from './dto';

@ApiTags('Days')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('days')
export class DayController {
  constructor(private readonly dayService: DayService) {}

  @ApiOperation({
    summary: 'Fetch Days of an Event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DAY_VIEW_ALL)
  @Get()
  getAllDays(@Query() dayQueryParamsDto: DayQueryParamsDto) {
    return this.dayService.getAllDays(dayQueryParamsDto);
  }
}
