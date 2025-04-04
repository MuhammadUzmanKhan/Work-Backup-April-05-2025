import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { User } from '@ontrack-tech-group/common/models';
import { InventoryTypeService } from './inventory-type.service';
import {
  AssignedAvailableQueryParamsDto,
  InventoryTypeQueryParamsDto,
} from './dto';

@ApiTags('Inventory Types')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('inventory-types')
export class InventoryTypeController {
  constructor(private readonly inventoryTypeService: InventoryTypeService) {}

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INVENTORY_TYPE_VIEW_ALL)
  @Get()
  getAllInventoryTypes(
    @AuthUser() user: User,
    @Query() inventoryTypeQueryParamsDto: InventoryTypeQueryParamsDto,
  ) {
    return this.inventoryTypeService.getAllInventoryTypes(
      user,
      inventoryTypeQueryParamsDto,
    );
  }

  @ApiTags('Get Inventory Types Assigned and Available')
  // @UseGuards(RolePermissionGuard)
  // @RolePermissions(UserAccess.INVENTORY_TYPE_AVAILABLE_AND_ASSIGNED)
  @Get('available-and-assigned')
  getAvailableAndAssigned(
    @AuthUser() user: User,
    @Query()
    assignedAvailableInventoryTypeQueryParamsDto: AssignedAvailableQueryParamsDto,
  ) {
    return this.inventoryTypeService.getAvailableAndAssigned(
      user,
      assignedAvailableInventoryTypeQueryParamsDto,
    );
  }
}
