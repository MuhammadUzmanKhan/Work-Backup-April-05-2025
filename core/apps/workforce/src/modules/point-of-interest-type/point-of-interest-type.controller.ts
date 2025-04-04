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
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PointOfInterestTypeService } from './point-of-interest-type.service';
import {
  CreatePointOfInterestTypeDto,
  PointOfInterestTypeQueryParamsDto,
  UpdatePointOfInterestTypeDto,
} from './dto';

@ApiTags('Point Of Interest Types')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('point-of-interest-types')
export class PointOfInterestTypeController {
  constructor(
    private readonly pointOfInterestTypeService: PointOfInterestTypeService,
  ) {}

  @ApiOperation({
    summary: 'Create a Point Of Interest Type',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POINT_OF_INTEREST_TYPE_CREATE)
  @Post()
  createPointOfInterestType(
    @Body() createPointOfInterestTypeDto: CreatePointOfInterestTypeDto,
  ) {
    return this.pointOfInterestTypeService.createPointOfInterestType(
      createPointOfInterestTypeDto,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Point Of Interest Types',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POINT_OF_INTEREST_TYPE_VIEW_ALL)
  @Get()
  getAllPointOfInterestTypes(
    @Query()
    pointOfInterestTypeQueryParamsDto: PointOfInterestTypeQueryParamsDto,
  ) {
    return this.pointOfInterestTypeService.getAllPointOfInterestTypes(
      pointOfInterestTypeQueryParamsDto,
    );
  }

  @ApiOperation({
    summary: 'Update a Point Of Interest Type',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POINT_OF_INTEREST_TYPE_UPDATE)
  @Put('/:id')
  updatePointOfInterestType(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updatePointOfInterestDto: UpdatePointOfInterestTypeDto,
  ) {
    return this.pointOfInterestTypeService.updatePointOfInterestType(
      pathParamIdDto.id,
      updatePointOfInterestDto,
    );
  }

  @ApiOperation({
    summary: 'Destroy a Point Of Interest Type',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POINT_OF_INTEREST_TYPE_DELETE)
  @Delete('/:id')
  deletePointOfInterestType(@Param() pathParamIdDto: PathParamIdDto) {
    return this.pointOfInterestTypeService.deletePointOfInterestType(
      pathParamIdDto.id,
    );
  }
}
