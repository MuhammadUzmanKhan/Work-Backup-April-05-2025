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
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { User, VendorPosition } from '@ontrack-tech-group/common/models';
import { _UserAccess } from '@Common/constants';

import { VendorPositionV2Service } from './vendor-position.v2.service';
import { GetAllVendorPositionsDto } from './dto';
import { GetPositionDataQueryParamsDto } from './dto/get-position-table-data';

@ApiTags('Vendor Position')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('/v2/vendor-position')
export class VendorPositionV2Controller {
  constructor(
    private readonly vendorPositionService: VendorPositionV2Service,
  ) {}

  @ApiOperation({ summary: 'Fetch vendors position against event and company' })
  @Get('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_POSITION_VIEW)
  getAllVendorPositions(
    @Query() getAllVendorPositionsDto: GetAllVendorPositionsDto,
    @AuthUser() user: User,
  ): Promise<{ id: number; name: string; positions: VendorPosition[] }[]> {
    return this.vendorPositionService.getAllVendorPositions(
      getAllVendorPositionsDto,
      user,
    );
  }

  @ApiOperation({ summary: 'fetch positions listing data of stats' })
  @Get('/list')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_POSITION_VIEW)
  getVendorPositionListingStats(
    @Query() getAllVendorPositionsDto: GetPositionDataQueryParamsDto,
    @AuthUser() user: User,
  ): Promise<VendorPosition[]> {
    return this.vendorPositionService.getVendorPositionListingStats(
      getAllVendorPositionsDto,
      user,
    );
  }
}
