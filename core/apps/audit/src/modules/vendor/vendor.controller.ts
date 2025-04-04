import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { _UserAccess } from '@Common/constants';

import { VendorService } from './vendor.service';
import {
  CreateVendorDto,
  GetAllVendorsByEventDto,
  GetAllVendorsDto,
} from './dto';
import { createVendor } from './body';

@ApiTags('Vendor')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @ApiOperation({ summary: 'To create a vendor' })
  @Post()
  @ApiBody(createVendor)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_CREATE)
  createVendor(
    @Body() createVendorDto: CreateVendorDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.createVendor(createVendorDto, user);
  }

  @ApiOperation({ summary: 'To get list of all vendors against a company' })
  @Get()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_VIEW)
  getAllVendors(
    @Query() getAllVendorsDto: GetAllVendorsDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.getAllVendors(getAllVendorsDto, user);
  }

  @ApiOperation({ summary: 'To get list of all vendors against an event' })
  @Get('event')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_VIEW)
  getAllVendorsByEvent(
    @Query() getAllVendorsByEventDto: GetAllVendorsByEventDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.getAllVendorsByEvent(
      getAllVendorsByEventDto,
      user,
    );
  }

  @ApiOperation({ summary: 'To fetch a vendor by its Id' })
  @Get(':id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.VENDOR_VIEW)
  getVendorById(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.getVendorById(pathParamIdDto.id, user);
  }
}
