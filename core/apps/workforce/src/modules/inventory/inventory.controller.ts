import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { InventoryService } from './inventory.service';
import {
  AssociateUserWithInventoryDto,
  GetInventoryByTypeDto,
  GetInventoryDto,
  GetInventoryTypeDto,
  InventoryByStatsDto,
  UpdateInventoryDto,
  UploadImagesForInventory,
} from './dto';

@ApiTags('Inventories')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INVENTORY_ASSOCIATE_USER)
  @Post('/associate-user')
  associateUserToInventory(@Body() data: AssociateUserWithInventoryDto) {
    return this.inventoryService.associateUserToInventory(data);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INVENTORY_DISASSOCIATE_USER)
  @Post('/disassociate-user')
  disassociateUserToInventory(@Body() data: AssociateUserWithInventoryDto) {
    return this.inventoryService.disassociateUserToInventory(data);
  }

  @ApiTags('Upload Images Against Inventory')
  // @UseGuards(RolePermissionGuard)
  // @RolePermissions(UserAccess.INVENTORY_UPLOAD_ATTACHMENT)
  @Post('/upload-image')
  uploadImage(
    @Body() uploadImagesForInventory: UploadImagesForInventory,
    @AuthUser() user: User,
  ) {
    return this.inventoryService.uploadImage(uploadImagesForInventory, user);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INVENTORY_VIEW_ALL)
  @Get()
  getAllInventory(@Query() params: GetInventoryDto) {
    return this.inventoryService.getAllInventory(params);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INVENTORY_VIEW_ALL_BY_INVENTORY_TYPE,
    UserAccess.INVENTORY_ASSOCIATE_USER,
  )
  @Get('/type')
  getInventoriesByInventoryType(@Query() params: GetInventoryByTypeDto) {
    return this.inventoryService.getInventoriesByInventoryType(params);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.INVENTORY_INVENTORY_TYPES,
    UserAccess.INVENTORY_ASSOCIATE_USER,
  )
  @Get('/inventory-types')
  getInventoryType(
    @Query() getInventoryTypeDto: GetInventoryTypeDto,
    @AuthUser() user: User,
  ) {
    return this.inventoryService.getInventoryType(getInventoryTypeDto, user);
  }

  @ApiTags('Get Inventory Stat')
  // @UseGuards(RolePermissionGuard)
  // @RolePermissions(UserAccess.INVENTORY_VIEW_BY_STATS)
  @Get('/inventories-by-stats')
  getInventoryByStat(@Query() inventoryByStatsDto: InventoryByStatsDto) {
    return this.inventoryService.getInventoryByStat(inventoryByStatsDto);
  }

  @ApiOperation({
    summary: 'Get a Inventory by Id',
  })
  // @UseGuards(RolePermissionGuard)
  // @RolePermissions(UserAccess.INVENTORY_VIEW)
  @Get('/:id')
  getInventoryById(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
    @Query()
    eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.inventoryService.getInventoryById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update a Inventory by Id',
  })
  // @UseGuards(RolePermissionGuard)
  // @RolePermissions(UserAccess.INVENTORY_UPDATE)
  @Put('/:id')
  updateInventory(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body()
    updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateInventory(
      pathParamIdDto.id,
      updateInventoryDto,
    );
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INVENTORY_UPDATE_STATUS)
  @Put('/:id/enable')
  updateInventoryStatus(@Param() inventoryIdPathDto: PathParamIdDto) {
    return this.inventoryService.updateInventoryStatus(inventoryIdPathDto.id);
  }
}
