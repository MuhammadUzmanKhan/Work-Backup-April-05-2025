import { Request, Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
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
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { User } from '@ontrack-tech-group/common/models';
import { IncidentZoneService } from './incident-zone.service';
import {
  CameraZoneQueryParamsDto,
  IncidentMainZoneQueryParamsDto,
  IncidentSubZoneQueryParamsDto,
  CreateIncidentZoneDto,
  UpdateIncidentZoneDto,
  CreateIncidentSubZoneDto,
  UpdateIncidentSubZoneDto,
  CreateIncidentCameraZoneDto,
  CloneIncidentZoneDto,
} from './dto';
import {
  createIncidentZone,
  updateIncidentZone,
  createIncidentSubZone,
  updateIncidentSubZone,
  createIncidentCameraZone,
  uploadIncidentMainZone,
  uploadIncidentSubZone,
  uploadIncidentCameraZone,
} from './body';
import {
  UploadIncidentMainZoneDto,
  UploadIncidentCameraZoneDto,
  UploadIncidentSubZoneDto,
} from './dto';

@ApiTags('Incident Zones')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('incident-zones')
export class IncidentZoneController {
  constructor(private readonly incidentZoneService: IncidentZoneService) {}

  @ApiOperation({
    summary: 'Create a Incident Zone',
  })
  @ApiBody(createIncidentZone)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_CREATE)
  @Post()
  createIncidentZone(
    @Body() createIncidentZoneDto: CreateIncidentZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.createIncidentZone(
      createIncidentZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Create a Incident Sub-Zone',
  })
  @ApiBody(createIncidentSubZone)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_CREATE)
  @Post('/sub-zone')
  createIncidentSubZone(
    @Body() createIncidentSubZoneDto: CreateIncidentSubZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.createIncidentSubZone(
      createIncidentSubZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Create a Incident Camera-Zone',
  })
  @ApiBody(createIncidentCameraZone)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAMERA_ZONE_CREATE)
  @Post('/camera-zone')
  createIncidentCameraZone(
    @Body() createIncidentCameraZoneDto: CreateIncidentCameraZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.createIncidentCameraZone(
      createIncidentCameraZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Clone Event Zone, Sub-Zone, Event Camera',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_CLONE)
  @Post('/location-clone')
  cloneAllIncidentLocation(@Body() clone_locations: CloneIncidentZoneDto) {
    return this.incidentZoneService.cloneAllIncidentLocation(clone_locations);
  }

  @ApiOperation({
    summary: 'Upload Incident Main Zones through CSV',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_CREATE)
  @ApiBody(uploadIncidentMainZone)
  @Post('/upload')
  uploadIncidentMainZone(
    @Body() uploadIncidentMainZoneDto: UploadIncidentMainZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.uploadIncidentMainZone(
      uploadIncidentMainZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Upload Incident Sub Zones through CSV',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_CREATE)
  @ApiBody(uploadIncidentSubZone)
  @Post('/upload/sub-zone')
  uploadIncidentSubZone(
    @Body() uploadIncidentSubZoneDto: UploadIncidentSubZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.uploadIncidentSubZone(
      uploadIncidentSubZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Upload Camera Zones through CSV',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAMERA_ZONE_CREATE)
  @ApiBody(uploadIncidentCameraZone)
  @Post('/upload/camera-zones')
  uploadIncidentCameraZone(
    @Body() uploadIncidentCameraZoneDto: UploadIncidentCameraZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.uploadIncidentCameraZone(
      uploadIncidentCameraZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Incident Zones',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INCIDENT_ZONE_VIEW_ALL,
    UserAccess.INCIDENT_ZONE_DOWNLOAD_PDF,
  )
  @Get()
  getAllIncidentZones(
    @Query() incidentZoneQueryParamsDto: IncidentMainZoneQueryParamsDto,
    @Res() res: Response,
    @Req() req: Request,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.getAllIncidentZonesV1(
      incidentZoneQueryParamsDto,
      res,
      req,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Incident Zones V1 optimised Version',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_VIEW_ALL)
  @Get('/v1')
  getAllIncidentZonesV1(
    @Query() incidentZoneQueryParamsDto: IncidentMainZoneQueryParamsDto,
    @Res() res: Response,
    @Req() req: Request,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.getAllIncidentZones(
      incidentZoneQueryParamsDto,
      res,
      req,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Incident Sub Zones',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_VIEW_ALL)
  @Get('/sub-zones')
  getAllIncidentSubZones(
    @Query() incidentSubZoneQueryParamsDto: IncidentSubZoneQueryParamsDto,
    @Res() res: Response,
  ) {
    return this.incidentZoneService.getAllIncidentSubZonesv1(
      incidentSubZoneQueryParamsDto,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Incident Sub Zones V1',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_VIEW_ALL)
  @Get('/sub-zones/v1')
  getAllIncidentSubZonesv1(
    @Query() incidentSubZoneQueryParamsDto: IncidentSubZoneQueryParamsDto,
    @Res() res: Response,
  ) {
    return this.incidentZoneService.getAllIncidentSubZones(
      incidentSubZoneQueryParamsDto,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Incident Camera Zones',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAMERA_ZONE_VIEW_ALL)
  @Get('/camera-zones')
  getAllCameraZones(
    @Query() cameraZoneQueryParamsDto: CameraZoneQueryParamsDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.incidentZoneService.getAllCameraZones(
      cameraZoneQueryParamsDto,
      res,
      req,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Counts for Zones, Sub-Zones and Event-Cameras',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_VIEW_ALL)
  @Get('/counts')
  getAllCountForLocation(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.incidentZoneService.getAllCountForLocation(
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Download csv against an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_DOWNLOAD_CSV)
  @Get('/csv')
  getCsvForLocation(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.incidentZoneService.getCsvForLocation(
      user,
      eventIdQueryDto,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Incident Zones & Sub Zones Name',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_VIEW_ALL)
  @Get('/names')
  getAllIncidentZonesName(
    @Query() eventQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.getAllIncidentZonesName(
      user,
      eventQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Update an Incident Zone',
  })
  @ApiBody(updateIncidentZone)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_UPDATE)
  @Put('/:id')
  updateIncidentZone(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentZoneDto: UpdateIncidentZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.updateIncidentZone(
      pathParamIdDto.id,
      updateIncidentZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update an Incident Sub-Zone',
  })
  @ApiBody(updateIncidentSubZone)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_UPDATE)
  @Put('/:id/sub-zone')
  updateIncidentSubZone(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentSubZoneDto: UpdateIncidentSubZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.updateIncidentSubZone(
      pathParamIdDto.id,
      updateIncidentSubZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update an Incident Camera-Zone',
  })
  @ApiBody(createIncidentCameraZone)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAMERA_ZONE_UPDATE)
  @Put('/:id/camera-zone')
  updateIncidentCameraZone(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentCameraZoneDto: CreateIncidentCameraZoneDto,
    @AuthUser() user: User,
  ) {
    return this.incidentZoneService.updateIncidentCameraZone(
      pathParamIdDto.id,
      updateIncidentCameraZoneDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Delete a Incident Zone',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_DELETE)
  @Delete('/:id')
  deleteIncidentZone(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.incidentZoneService.deleteIncidentZone(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Delete a Incident Sub-Zone',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_ZONE_DELETE)
  @Delete('/:id/sub-zone')
  deleteIncidentSubZone(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.incidentZoneService.deleteIncidentZone(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Delete an Incident Camera-Zone',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAMERA_ZONE_DELETE)
  @Delete('/:id/camera-zone')
  deleteIncidentCameraZone(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.incidentZoneService.deleteIncidentCameraZone(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }
}
