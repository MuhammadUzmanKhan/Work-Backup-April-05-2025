import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@ontrack-tech-group/common/models';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PriorityGuideService } from './priority-guide.service';
import {
  GetAllPriorityGuideDto,
  GetPriorityGuideById,
  UpdatePriorityGuideDto,
  UpdatePriorityGuideScaleSettingDto,
} from './dto';

@ApiTags('Priority Guides')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('priority-guides')
export class PriorityGuideController {
  constructor(private readonly priorityGuideService: PriorityGuideService) {}

  @ApiOperation({
    summary: 'Fetch all Priority Guides',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRIORITY_GUIDE_VIEW_ALL)
  @Get()
  getAllPriorityGuides(
    @Query() getAllPriorityGuideDto: GetAllPriorityGuideDto,
    @AuthUser() user: User,
  ) {
    return this.priorityGuideService.getAllPriorityGuides(
      getAllPriorityGuideDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch A Priority Guides',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRIORITY_GUIDE_VIEW)
  @Get('/:id')
  getPriorityGuideById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() getPriorityGuideById: GetPriorityGuideById,
  ) {
    return this.priorityGuideService.getPriorityGuideById(
      pathParamIdDto.id,
      getPriorityGuideById,
    );
  }

  @ApiOperation({
    summary: 'Update a Priority Guide Scale Setting',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRIORITY_GUIDE_UPDATE)
  @Put('/scale-setting')
  updateScaleSetting(
    @Body()
    updatePriorityGuideScaleSettingDto: UpdatePriorityGuideScaleSettingDto,
  ) {
    return this.priorityGuideService.updateScaleSetting(
      updatePriorityGuideScaleSettingDto,
    );
  }

  @ApiOperation({
    summary: 'Update a Priority Guide',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRIORITY_GUIDE_UPDATE)
  @Put('/:id')
  updatePriorityGuide(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updatePriorityGuideDto: UpdatePriorityGuideDto,
  ) {
    return this.priorityGuideService.updatePriorityGuide(
      pathParamIdDto.id,
      updatePriorityGuideDto,
    );
  }
}
