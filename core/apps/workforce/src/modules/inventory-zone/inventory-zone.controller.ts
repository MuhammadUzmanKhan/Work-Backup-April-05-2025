import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { InventoryZoneService } from './inventory-zone.service';
import { InventoryZoneQueryParamsDto } from './dto';

@ApiTags('Inventory Zones')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('inventory-zones')
export class InventoryZoneController {
  constructor(private readonly inventoryZoneService: InventoryZoneService) {}

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INVENTORY_ZONE_VIEW_ALL)
  @Get()
  getAllInventoryZones(
    @Query() inventoryZoneQueryParamsDto: InventoryZoneQueryParamsDto,
  ) {
    return this.inventoryZoneService.getAllInventoryZones(
      inventoryZoneQueryParamsDto,
    );
  }
}
