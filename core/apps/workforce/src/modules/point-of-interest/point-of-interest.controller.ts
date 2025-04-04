import { Response, Request } from 'express';
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
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PointOfInterestService } from './point-of-interest.service';
import {
  CreatePointOfInterestDto,
  PointOfInterestQueryParamsDto,
  UpdatePointOfInterestDto,
} from './dto';

@ApiTags('Point Of Interests')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('point-of-interests')
export class PointOfInterestController {
  constructor(
    private readonly pointOfInterestService: PointOfInterestService,
  ) {}

  @ApiOperation({
    summary: 'Create a Point Of Interest',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POINT_OF_INTEREST_CREATE)
  @Post()
  createPointOfInterest(
    @Body() createPointOfInterestDto: CreatePointOfInterestDto,
  ) {
    return this.pointOfInterestService.createPointOfInterest(
      createPointOfInterestDto,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Point Of Interests',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POINT_OF_INTEREST_VIEW_ALL)
  @Get()
  getAllPointOfInterests(
    @Query() pointOfInterestQueryParamsDto: PointOfInterestQueryParamsDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.pointOfInterestService.getAllPointOfInterests(
      pointOfInterestQueryParamsDto,
      res,
      req,
    );
  }

  @ApiOperation({
    summary: 'Update a Point Of Interest',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POINT_OF_INTEREST_UPDATE)
  @Put('/:id')
  updatePointOfInterest(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updatePointOfInterestDto: UpdatePointOfInterestDto,
  ) {
    return this.pointOfInterestService.updatePointOfInterest(
      pathParamIdDto.id,
      updatePointOfInterestDto,
    );
  }

  @ApiOperation({
    summary: 'Destroy a Point Of Interest',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.POINT_OF_INTEREST_DELETE)
  @Delete('/:id')
  deletePointOfInterest(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.pointOfInterestService.deletePointOfInterest(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }
}
