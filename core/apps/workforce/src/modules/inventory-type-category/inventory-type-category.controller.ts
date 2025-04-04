import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { InventoryTypeCategoryService } from './inventory-type-category.service';
import { InventoryTypeCategoryQueryParamsDto } from './dto';

@ApiTags('Inventory Type Categories')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('inventory-type-categories')
export class InventoryTypeCategoryController {
  constructor(
    private readonly inventoryTypeCategoryService: InventoryTypeCategoryService,
  ) {}

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INVENTORY_TYPE_CATEGORY_VIEW_ALL)
  @Get()
  getAllInventoryTypeCategories(
    @Query()
    inventoryTypeCategoryQueryParamsDto: InventoryTypeCategoryQueryParamsDto,
    @AuthUser() user: User,
  ) {
    return this.inventoryTypeCategoryService.getAllInventoryTypeCategories(
      inventoryTypeCategoryQueryParamsDto,
      user,
    );
  }
}
