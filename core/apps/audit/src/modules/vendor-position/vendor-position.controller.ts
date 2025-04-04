import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { _UserAccess } from '@Common/constants';

import { VendorPositionService } from './vendor-position.service';
import {
  CreateVendorPositionDto,
  GetAllVendorPositionsByEventDto,
  GetAllVendorPositionsDto,
} from './dto';
import { createVendorPosition } from './body';

@ApiTags('Vendor Position')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('vendor-position')
export class VendorPositionController {
  constructor(private readonly vendorPositionService: VendorPositionService) {}

  @ApiOperation({ summary: 'To create a vendor position against a company' })
  @Post()
  @ApiBody(createVendorPosition)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_POSITION_CREATE)
  createVendorPosition(
    @Body() createVendorPositionDto: CreateVendorPositionDto,
    @AuthUser() user: User,
  ) {
    return this.vendorPositionService.createVendorPosition(
      createVendorPositionDto,
      user,
    );
  }

  @ApiOperation({
    summary:
      'To get all common vendor positions including custom positions for a company',
  })
  @Get()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_POSITION_VIEW)
  getAllVendorPositions(
    @Query() getAllVendorPositionsDto: GetAllVendorPositionsDto,
    @AuthUser() user: User,
  ) {
    return this.vendorPositionService.getAllVendorPositions(
      getAllVendorPositionsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'To get all vendor positions added in an event',
  })
  @Get('/event')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_POSITION_VIEW)
  getAllVendorPositionsByEvent(
    @Query() getAllVendorPositionsByEventDto: GetAllVendorPositionsByEventDto,
    @AuthUser() user: User,
  ) {
    return this.vendorPositionService.getAllVendorPositionsByEvent(
      getAllVendorPositionsByEventDto,
      user,
    );
  }
}
