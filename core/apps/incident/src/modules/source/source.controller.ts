import { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { CloneDto } from '@Common/dto';
import { SourceService } from './source.service';
import {
  AssignOrRemoveToEventDto,
  UpdateSourceDto,
  CreateSourceDto,
  SourceQueryParamsDto,
  UploadSourcesForEventDto,
  DestroyMultipleSourcesDto,
} from './dto';
import {
  destroyMultipleSources,
  manageSourceTypes,
  uploadSourcesForEvent,
} from './body';

@ApiTags('Sources')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('sources')
export class SourceController {
  constructor(private readonly sourceService: SourceService) {}

  @ApiOperation({
    summary: 'Create a Source',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_CREATE)
  @Post()
  createSource(
    @Body() createSourceDto: CreateSourceDto,
    @AuthUser() user: User,
  ) {
    return this.sourceService.createSource(createSourceDto, user);
  }

  @ApiOperation({ summary: 'Upload the sources against event through CSV.' })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_UPLOAD)
  @ApiBody(uploadSourcesForEvent)
  @Post('/upload')
  async uploadSourcesForEvents(
    @Body() uploadSourcesForEventDto: UploadSourcesForEventDto,
    @AuthUser() user: User,
  ) {
    return this.sourceService.uploadSourcesForEvents(
      uploadSourcesForEventDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Assign or Remove Sources to Event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_MANAGE)
  @ApiBody(manageSourceTypes)
  @Post('/manage-sources')
  manageSources(
    @Body() assignOrRemoveToEventDto: AssignOrRemoveToEventDto,
    @AuthUser() user: User,
  ) {
    return this.sourceService.manageSources(assignOrRemoveToEventDto, user);
  }

  @ApiOperation({
    summary: 'Clone Event Sources',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_CLONE)
  @Post('/clone')
  cloneEventSource(@Body() clone_sources: CloneDto) {
    return this.sourceService.cloneEventSource(clone_sources);
  }

  @ApiOperation({
    summary: 'Fetch all Sources',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_VIEW_ALL)
  @Get('')
  getAllSources(
    @Query() sourceQueryParamsDto: SourceQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.sourceService.getAllSourcesv1(sourceQueryParamsDto, user, res);
  }

  @ApiOperation({
    summary: 'Fetch all Sources V1',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_VIEW_ALL)
  @Get('/v1')
  getAllSourcesv1(
    @Query() sourceQueryParamsDto: SourceQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.sourceService.getAllSources(sourceQueryParamsDto, user, res);
  }

  @ApiOperation({
    summary: 'Get Source by Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_VIEW)
  @Get('/:id')
  getSourceById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdDto: EventIdQueryDto,
  ) {
    return this.sourceService.getSourceById(
      pathParamIdDto.id,
      eventIdDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Update a Source',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_UPDATE)
  @Put('/:id')
  updateSource(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateSourceDto: UpdateSourceDto,
    @AuthUser() user: User,
  ) {
    return this.sourceService.updateSource(
      pathParamIdDto.id,
      updateSourceDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Destroy Multiple Sources',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SOURCE_DELETE)
  @ApiBody(destroyMultipleSources)
  @Delete()
  deleteSource(
    @Body() destroyMultipleSourcesDto: DestroyMultipleSourcesDto,
    @AuthUser() user: User,
  ) {
    return this.sourceService.deleteSource(destroyMultipleSourcesDto, user);
  }
}
