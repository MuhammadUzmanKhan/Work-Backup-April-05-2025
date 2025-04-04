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
import { PositionService } from './position.service';

@ApiTags('Position')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('position')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @ApiOperation({
    summary: 'To get all positions for a company or event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POSITION_VIEW_ALL)
  @Get('/')
  getAllPositions(
    @Query() nameCompanyDto: NameCompanyDto,
    @AuthUser() user: User,
  ) {
    return this.positionService.getAllPositions(nameCompanyDto, user);
  }
}
