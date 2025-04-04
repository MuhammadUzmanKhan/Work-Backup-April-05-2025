import {
  Body,
  Controller,
  Delete,
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
import { User } from '@ontrack-tech-group/common/models';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { UserAccess } from '@Common/constants';
import { DotService } from './dot.service';
import {
  cloneDot,
  uploadDots,
  updateDot,
  copyDot,
  updateBulkDot,
  swapDots,
  resetDeploymentDto,
} from './body';
import {
  UploadDotsDto,
  CloneDotDto,
  GetDotsByEventDto,
  UpdateDotDto,
  BulkDotsDeleteDto,
  CopyDotDto,
  UpdateBulkDotsDto,
  SwapDotsDto,
  ResetDeploymentDto,
} from './dto';

@ApiTags('Dot')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('dot')
export class DotController {
  constructor(private readonly dotService: DotService) {}

  @ApiOperation({
    summary: 'Upload dots through CSV',
  })
  @ApiBody(uploadDots)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_UPLOAD)
  @Post('/upload')
  uploadDots(@Body() uploadDotsDto: UploadDotsDto, @AuthUser() user: User) {
    return this.dotService.uploadDots(uploadDotsDto, user);
  }

  @ApiOperation({
    summary: 'Clone dots',
  })
  @ApiBody(cloneDot)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_CLONE)
  @Post('/clone')
  cloneDot(@Body() cloneDotDto: CloneDotDto, @AuthUser() user: User) {
    return this.dotService.cloneDot(cloneDotDto, user);
  }

  @ApiOperation({
    summary: 'Copy Base Deployment',
  })
  @ApiBody(copyDot)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_COPY)
  @Post('/copy')
  copyDot(@Body() copyDotDto: CopyDotDto, @AuthUser() user: User) {
    return this.dotService.copyDot(copyDotDto, user);
  }

  @ApiOperation({
    summary: 'Swap Dots against Vendor',
  })
  @ApiBody(swapDots)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_SWAP)
  @Post('/swap')
  swapDots(@Body() swapDotsDto: SwapDotsDto, @AuthUser() user: User) {
    return this.dotService.swapDots(swapDotsDto, user);
  }

  @ApiOperation({
    summary: 'To Fetch a list of dots against an event by vendor',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_VIEW_ALL)
  @Get('/')
  getAllDotsByEvent(
    @Query() getDotsByEventDto: GetDotsByEventDto,
    @AuthUser() user: User,
  ) {
    return this.dotService.getAllDotsByEvent(getDotsByEventDto, user);
  }

  @ApiOperation({
    summary: 'To check if any dots exist against an event',
  })
  @Get('/dot-exist')
  checkIfAnyDotExist(@Query() eventIdQueryDto: EventIdQueryDto) {
    return this.dotService.checkIfAnyDotExist(eventIdQueryDto.event_id);
  }

  @ApiOperation({
    summary: 'To update bulk dots against an event',
  })
  @ApiBody(updateBulkDot)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_UPDATE)
  @Put('/bulk')
  updateBulkDots(
    @Body() updateBulkDotsDto: UpdateBulkDotsDto,
    @AuthUser() user: User,
  ) {
    return this.dotService.updateBulkDots(updateBulkDotsDto, user);
  }

  @ApiOperation({
    summary: 'To update a dot against an event',
  })
  @ApiBody(updateDot)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_UPDATE)
  @Put('/:id')
  updateDot(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateDotDto: UpdateDotDto,
    @AuthUser() user: User,
  ) {
    return this.dotService.updateDot(pathParamIdDto.id, updateDotDto, user);
  }

  @ApiOperation({
    summary: 'Destroy bulk Dots from an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_DELETE)
  @Delete('/bulk')
  deleteBulkDot(
    @Query() bulkDotsDeleteDto: BulkDotsDeleteDto,
    @AuthUser() user: User,
  ) {
    return this.dotService.deleteBulkDot(bulkDotsDeleteDto, user);
  }

  @ApiOperation({
    summary: 'Reset entire deployment by removing all dots from an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOTS_RESET)
  @ApiBody(resetDeploymentDto)
  @Delete('/reset')
  resetDeployment(
    @Body() resetDeploymentDto: ResetDeploymentDto,
    @AuthUser() user,
  ) {
    return this.dotService.resetDeployment(resetDeploymentDto, user);
  }

  @ApiOperation({
    summary: 'Destroy a Dot from an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_DELETE)
  @Delete('/:id')
  deleteDot(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.dotService.deleteDot(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }
}
