import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { CompanyIdDto, PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { User } from '@ontrack-tech-group/common/models';
import { IncidentTypeManagement } from './type-management.service';
import {
  CreateNewIncidentTypeAndVariationDto,
  CreateTypeVariationDto,
  GetAllVariantsDto,
  GetCountDto,
  GetIncidentTranslationChangelogDto,
  GetTranslationsDto,
  UpdateTypeVariationDto,
} from './dto';
import { createNewIncidentTypeAndVariationBody } from './body';

@ApiTags('Type Management')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('type-management')
export class IncidentTypeManagementController {
  constructor(
    private readonly incidentTypeManagement: IncidentTypeManagement,
  ) {}

  @ApiOperation({
    summary: 'Create an Incident Type Variation with languages',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGEMENT_CREATE)
  @Post()
  createTypeVariation(
    @Body() createTypeVariationDto: CreateTypeVariationDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeManagement.createTypeVariation(
      createTypeVariationDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Create variations of incident type',
  })
  @ApiBody(createNewIncidentTypeAndVariationBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGEMENT_CREATE)
  @Post('/variation')
  createNewIncidentTypeAndVariation(
    @Body()
    createNewIncidentTypeAndVariationDto: CreateNewIncidentTypeAndVariationDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeManagement.createNewIncidentTypeAndVariation(
      createNewIncidentTypeAndVariationDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get Translation for Creation on incident type and variation',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGEMENT_VIEW_VARIATION)
  @Get()
  getTranslationsForSubCompanies(
    @Query() getTranslationsDto: GetTranslationsDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeManagement.getTranslationsForSubCompanies(
      getTranslationsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get all variation of incident type',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGEMENT_VIEW_VARIATION)
  @Get('/all/variations')
  getAllVariantionsOfIncidentType(
    @Query() getAllVariationDto: GetAllVariantsDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeManagement.getAllVariantionsOfIncidentType(
      getAllVariationDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch changelogs of a Incident Type Translations',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGEMENT_CHANGE_LOG)
  @Get('/change-logs')
  getIncidentTypeTranslationsChangelogs(
    @Query()
    getIncidentTranslationChangelogDto: GetIncidentTranslationChangelogDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeManagement.getIncidentTypeTranslationsChangelogs(
      getIncidentTranslationChangelogDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch Single Core Incident type data',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGEMENT_VIEW_VARIATION)
  @Get('/core/:id')
  getSingleCoreIncidentTypeData(
    @Param() getSingleCoreIncidentTypeDto: PathParamIdDto,
    @Query() companyIdDto: CompanyIdDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeManagement.getSingleCoreIncidentTypeData(
      getSingleCoreIncidentTypeDto.id,
      companyIdDto.company_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Fetch Count of Incident type data',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGEMENT_VIEW_VARIATION)
  @Get('/count')
  getCount(@Query() getCountDto: GetCountDto, @AuthUser() user: User) {
    return this.incidentTypeManagement.getCount(getCountDto, user);
  }

  @ApiOperation({
    summary: 'Update an Incident Type Variation with languages',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_TYPE_MANAGEMENT_UPDATE)
  @Put('/:id')
  updateTypeVariation(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateTypeVariationDto: UpdateTypeVariationDto,
    @AuthUser() user: User,
  ) {
    return this.incidentTypeManagement.updateTypeVariation(
      pathParamIdDto,
      updateTypeVariationDto,
      user,
    );
  }
}
