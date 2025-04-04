import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { User } from '@ontrack-tech-group/common/models';
import { CloneDto } from '@Common/dto';
import { ReferenceMapService } from './reference-map.service';
import {
  BulkDeleteUpdateReferenceMapDto,
  CreateReferenceMapDto,
  ReferenceMapDto,
  UpdateReferenceMapDto,
} from './dto';

@ApiTags('Reference Maps')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('reference-maps')
export class ReferenceMapController {
  constructor(private readonly referenceMapService: ReferenceMapService) {}

  @ApiOperation({
    summary: 'Create a Reference Map',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.REFERENCE_MAP_CREATE)
  @Post()
  createReferenceMap(
    @Body() createReferenceMapDto: CreateReferenceMapDto,
    @AuthUser() user: User,
  ) {
    return this.referenceMapService.createReferenceMap(
      user,
      createReferenceMapDto,
    );
  }

  @ApiOperation({
    summary: 'Clone Event Reference Map',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.REFERENCE_MAP_CLONE)
  @Post('/clone')
  cloneReferenceMap(@Body() clone_ref_map: CloneDto, @AuthUser() user: User) {
    return this.referenceMapService.cloneReferenceMap(user, clone_ref_map);
  }

  @ApiOperation({
    summary: 'Fetch all Reference Maps',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.REFERENCE_MAP_VIEW_ALL,
    UserAccess.REFERENCE_MAP_DOWNLOAD_PDF,
  )
  @Get()
  getAllReferenceMaps(@Query() refMapDto: ReferenceMapDto) {
    return this.referenceMapService.getAllReferenceMaps(refMapDto);
  }

  @ApiOperation({
    summary: 'Get a Reference Map by Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.REFERENCE_MAP_VIEW)
  @Get('/:id')
  getReferenceMapById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.referenceMapService.getReferenceMapById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Update a Reference Map Current Version',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.REFERENCE_MAP_UPDATE)
  @Put('/current-version')
  updateCurrentVersion(
    @Body() bulkDeleteReferenceMapDto: BulkDeleteUpdateReferenceMapDto,
    @AuthUser() user: User,
  ) {
    return this.referenceMapService.updateCurrentVersion(
      bulkDeleteReferenceMapDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update a Reference Map',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.REFERENCE_MAP_UPDATE)
  @Put('/:id')
  updateReferenceMap(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateReferenceMapDto: UpdateReferenceMapDto,
  ) {
    return this.referenceMapService.updateReferenceMap(
      pathParamIdDto.id,
      updateReferenceMapDto,
    );
  }

  @ApiOperation({
    summary: 'Bulk Destroy Reference Map',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.REFERENCE_MAP_DELETE)
  @Delete('/bulk-delete')
  deleteBulkReferenceMap(
    @Body() bulkDeleteReferenceMapDto: BulkDeleteUpdateReferenceMapDto,
  ) {
    return this.referenceMapService.deleteBulkReferenceMap(
      bulkDeleteReferenceMapDto,
    );
  }

  @ApiOperation({
    summary: 'Destroy a Reference Map',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.REFERENCE_MAP_DELETE)
  @Delete('/:id')
  deleteReferenceMap(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.referenceMapService.deleteReferenceMap(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }
}
