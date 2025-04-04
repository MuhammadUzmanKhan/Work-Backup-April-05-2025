import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
import { User, VendorPosition } from '@ontrack-tech-group/common/models';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { _UserAccess } from '@Common/constants';
import { GetAllVendorPositionsDto } from '@Modules/vendor-position/dto';

import {
  GetAllVendorsByDatesDto,
  GetAllVendorsByShiftAndPositionDto,
  GetAllVendorsDto,
  GetVendorsByPositionDto,
} from './dto';
import { GetAllVendors, GroupedVendorData } from './helper/interface';
import { VendorV2Service } from './vendor.v2.service';

@ApiTags('Vendor')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('/v2/vendor')
export class VendorV2Controller {
  constructor(private readonly vendorService: VendorV2Service) {}

  @ApiOperation({ summary: 'To get list of all vendors against a company' })
  @Get('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_VIEW)
  getAllVendors(
    @Query() getAllVendorsDto: GetAllVendorsDto,
    @AuthUser() user: User,
  ): Promise<GetAllVendors[]> {
    return this.vendorService.getAllVendors(getAllVendorsDto, user);
  }

  @ApiOperation({
    summary:
      'Retrieve a comprehensive overview of a vendor for a specific position, including shift with check-in and check-out records.',
  })
  @Get('/by-position')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_VIEW)
  getPositionOfAVendor(
    @Query()
    getAllVendorsByPositionDto: GetVendorsByPositionDto,
  ): Promise<GroupedVendorData[]> {
    return this.vendorService.getVendorsByPosition(getAllVendorsByPositionDto);
  }

  @ApiOperation({
    summary:
      'Retrieve a comprehensive overview of all vendors for a specific company, including shift and position details with check-in and check-out records.',
  })
  @Get('/overview')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_VIEW)
  getAllVendorsByPositionAndShifts(
    @Query()
    getAllVendorsByShiftAndPositionDto: GetAllVendorsByShiftAndPositionDto,
    @AuthUser() user: User,
  ): Promise<GroupedVendorData[]> {
    return this.vendorService.getAllVendorsByPositionAndShifts(
      getAllVendorsByShiftAndPositionDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get created Vendors By Dates',
  })
  @Get('/vendors-by-date')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_VIEW)
  getVendorsByDate(
    @Query() getAllVendorsByDatesDto: GetAllVendorsByDatesDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.getVendorsByDate(getAllVendorsByDatesDto, user);
  }

  @ApiOperation({ summary: 'Fetch vendors position against a single vendor' })
  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_POSITION_VIEW)
  getAllPositionsByVendor(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() getAllVendorPositionsDto: GetAllVendorPositionsDto,
    @AuthUser() user: User,
  ): Promise<VendorPosition[]> {
    return this.vendorService.getAllPositionsByVendor(
      pathParamIdDto.id,
      getAllVendorPositionsDto,
      user,
    );
  }
}
