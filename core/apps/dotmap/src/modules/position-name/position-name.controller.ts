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
import { PositionNameService } from './position-name.service';

@ApiTags('Position Name')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('position-name')
export class PositionNameController {
  constructor(private readonly positionNameService: PositionNameService) {}

  @ApiOperation({
    summary: 'To get all position name for a company or event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POSITION_NAME_VIEW_ALL)
  @Get('/')
  getAllPositionNames(
    @Query() nameCompanyDto: NameCompanyDto,
    @AuthUser() user: User,
  ) {
    return this.positionNameService.getAllPositionNames(nameCompanyDto, user);
  }
}
