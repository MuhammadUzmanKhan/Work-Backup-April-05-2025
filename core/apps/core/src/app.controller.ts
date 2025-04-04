import { Controller, Get, Query } from '@nestjs/common';
import { AuthUser, Public } from '@ontrack-tech-group/common/decorators';
import { ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { User } from '@ontrack-tech-group/common/models';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { AppService } from './app.service';
import { ViewPermissionsQueryDto } from './dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  healthCheck() {
    return this.appService.healthCheck();
  }

  @ApiOperation({
    summary: 'View Permissions',
  })
  @ApiHeader(COMPANY_ID_API_HEADER)
  @ApiBearerAuth()
  @Get('/view-permissions')
  viewPermissions(
    @Query() viewPermissionQueryDto: ViewPermissionsQueryDto,
    @AuthUser() user: User,
  ) {
    return this.appService.viewPermissions(viewPermissionQueryDto, user);
  }

  @ApiOperation({
    summary: 'View Active Event Module Roles List',
  })
  @ApiHeader(COMPANY_ID_API_HEADER)
  @ApiBearerAuth()
  @Get('/active-events-roles')
  viewActiveEventRoles(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.appService.viewActiveEventRoles(eventIdQueryDto.event_id, user);
  }

  @ApiOperation({ summary: 'Get module access for all roles' })
  @ApiBearerAuth()
  @ApiHeader(COMPANY_ID_API_HEADER)
  @Get('/module-access')
  getModuleAccess(@AuthUser() user: User) {
    return this.appService.getModuleAccess(user);
  }

  @ApiOperation({
    summary: 'View Roles List',
  })
  @ApiHeader(COMPANY_ID_API_HEADER)
  @ApiBearerAuth()
  @Get('/roles')
  viewRoles(@AuthUser() user: User) {
    return this.appService.viewRoles(user);
  }
}
