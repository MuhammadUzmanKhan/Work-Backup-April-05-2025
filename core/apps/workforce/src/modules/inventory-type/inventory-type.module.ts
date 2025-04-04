import { Module } from '@nestjs/common';
import { InventoryTypeService } from './inventory-type.service';
import { InventoryTypeController } from './inventory-type.controller';

@Module({
  controllers: [InventoryTypeController],
  providers: [InventoryTypeService],
})
export class InventoryTypeModule {}
