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
import { User } from '@ontrack-tech-group/common/models';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { UserAccess } from '@Common/constants';
import { NameCompanyDto } from '@Common/dto';
import { AreaService } from './area.service';

@ApiTags('Area')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('area')
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @ApiOperation({
    summary: 'To get all areas for a company or event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.AREA_VIEW_ALL)
  @Get('/')
  getAllAreas(@Query() nameCompanyDto: NameCompanyDto, @AuthUser() user: User) {
    return this.areaService.getAllAreas(nameCompanyDto, user);
  }
}
